import {expect, assert} from 'chai';
import 'chai-as-promised';
import deepEqual = require("deep-equal");
import {isDefined} from "./types";
import {
    TransactionSet,
    Transaction,
    TransactionError,
    TransactionContext,
    TransactionProgressHandler
} from './transaction';

describe('TransactionSet', function () {

    it('can get transaction IDs', () => {
        const rSet = new TransactionSet();
        rSet.addTransactions([new Transaction('r1'),
                              new Transaction('r2', ['r1']),
                              new Transaction('r3', ['r2'])]);
        let transactionIds = rSet.getTransactionIds();
        expect(new Set(transactionIds)).to.deep.equal(new Set(['r1', 'r2', 'r3']));
    });

    it('can collect transactions', () => {
        const rSet = new TransactionSet();
        rSet.addTransactions([new Transaction('r1'),
                              new Transaction('r2', ['r1']),
                              new Transaction('r3', ['r2'])]);
        let transactions = rSet.collectTransactions('r3');
        expect(transactions).to.deep.equal([rSet.getTransaction('r1'),
                                            rSet.getTransaction('r2'),
                                            rSet.getTransaction('r3')]);
    });

    it('can resolve transactions', () => {
        const tSet = new TransactionSet();
        tSet.addTransactions([new Transaction('r1'),
                              new Transaction('r2', ['r1']),
                              new Transaction('r3', ['r2'])]);
        let promise = tSet.fulfillTransaction('r3');
        return expect(promise).to.eventually.be.fulfilled;
    });

    it('does use progress callback', () => {
        const tSet = new TransactionSet();

        class MyTransaction extends Transaction {

            fulfilled(context: TransactionContext, progress: TransactionProgressHandler): Promise<boolean> {
                return Promise.resolve().then(() => {
                    progress({message: `checking ${this.name}`});
                    return false;
                });
            }

            fulfill(context: TransactionContext, progress: TransactionProgressHandler): Promise<any> {
                return Promise.resolve().then(() => {
                    progress({message: `fulfilling ${this.name}`});
                });
            }
        }

        tSet.addTransactions([new MyTransaction('r1'),
                              new MyTransaction('r2', ['r1']),
                              new MyTransaction('r3', ['r2'])]);

        let progressTrace = [];
        let onProgress = (progress) => {
            progressTrace.push(progress);
        };

        let promise = tSet.fulfillTransaction('r3', onProgress).then(() => progressTrace);
        return expect(promise).to.eventually.become([
                                                        {worked: 0, totalWork: 3, subWorked: 0, done: false},
                                                        {name: 'r1'},
                                                        {message: "checking r1"},
                                                        {message: "fulfilling r1"},
                                                        {worked: 1, totalWork: 3, subWorked: 0, done: false},
                                                        {name: 'r2'},
                                                        {message: "checking r2"},
                                                        {message: "fulfilling r2"},
                                                        {worked: 2, totalWork: 3, subWorked: 0, done: false},
                                                        {name: 'r3'},
                                                        {message: "checking r3"},
                                                        {message: "fulfilling r3"},
                                                        {worked: 3, totalWork: 3, subWorked: 0, done: true},
                                                    ] as any);
    });

    describe('TransactionSet failures', function () {

        class MyTransactionFailingOnR3 extends Transaction {

            fulfilled(context: TransactionContext, progress: TransactionProgressHandler): Promise<boolean> {
                return Promise.resolve().then(() => {
                    progress({message: `checking ${this.name} files exist`});
                    return false;
                });
            }

            fulfill(context: TransactionContext, progress: TransactionProgressHandler): Promise<any> {
                return Promise.resolve().then(() => {
                    progress({message: `adding ${this.name} files`});
                    if (this.name === 'r3') {
                        throw new Error('disk full');
                    }
                });
            }

            rollback(context: TransactionContext, progress: TransactionProgressHandler): Promise<any> {
                return Promise.resolve().then(() => {
                    progress({message: `removing ${this.name} files`});
                });
            }
        }

        it('will reject', () => {
            const tSet = new TransactionSet();
            tSet.addTransactions([new MyTransactionFailingOnR3('r1'),
                                  new MyTransactionFailingOnR3('r2', ['r1']),
                                  new MyTransactionFailingOnR3('r3', ['r2'])]);
            return tSet.fulfillTransaction('r3').should.be.rejected;
        });

        it('will rollback', () => {
            const tSet = new TransactionSet();
            tSet.addTransactions([new MyTransactionFailingOnR3('r1'),
                                  new MyTransactionFailingOnR3('r2', ['r1']),
                                  new MyTransactionFailingOnR3('r3', ['r2'])]);

            let progressTrace = [];
            let onProgress = (progress) => {
                progressTrace.push(progress);
            };

            let promise = tSet.fulfillTransaction('r3', onProgress).catch(() => progressTrace);
            let expectedError = new TransactionError(tSet.getTransaction('r3'), 2, new Error('disk full'));

            const expectedProgressTrace = [
                {worked: 0, totalWork: 3, subWorked: 0, done: false},
                {name: 'r1'},
                {message: 'checking r1 files exist'},
                {message: 'adding r1 files'},
                {worked: 1, totalWork: 3, subWorked: 0, done: false},
                {name: 'r2'},
                {message: 'checking r2 files exist'},
                {message: 'adding r2 files'},
                {worked: 2, totalWork: 3, subWorked: 0, done: false},
                {name: 'r3'},
                {message: 'checking r3 files exist'},
                {message: 'adding r3 files'},
                {error: expectedError},
                {name: 'Rolling back "r3"'},
                {message: 'removing r3 files'},
                {worked: 2, totalWork: 3, subWorked: 0, done: false},
                {name: 'Rolling back "r2"'},
                {message: 'removing r2 files'},
                {worked: 1, totalWork: 3, subWorked: 0, done: false},
                {name: 'Rolling back "r1"'},
                {message: 'removing r1 files'},
                {worked: 0, totalWork: 3, subWorked: 0, done: true},
            ];
            promise.then(r => console.log(r));

            const p1 = expect(promise, "number of events").to.eventually.satisfy((actualProgressTrace) => {
                return actualProgressTrace.length === expectedProgressTrace.length;
            });

            const p2 = expect(promise, "error at index 12").to.eventually.satisfy((actualProgressTrace) => {
                return isDefined(actualProgressTrace[12].error);
            });

            const p3 = expect(promise, "all events are deeply equal").to.eventually.satisfy((actualProgressTrace) => {
                // Exclude error at index 12 from comparison
                actualProgressTrace[12] = null;
                expectedProgressTrace[12] = null;
                return deepEqual(actualProgressTrace, expectedProgressTrace);
            });

            return Promise.all([p1, p2, p3]);
        });
    });

});
