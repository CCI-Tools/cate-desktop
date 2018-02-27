import {expect, assert} from 'chai';
import 'chai-as-promised';
import deepEqual = require("deep-equal");
import {isDefined} from "./types";
import {
    RequirementSet,
    Requirement,
    RequirementError,
    RequirementContext,
    RequirementProgressHandler
} from './requirement';

describe('RequirementSet', function () {

    it('can get requirement IDs', () => {
        const rSet = new RequirementSet();
        rSet.addRequirements([new Requirement('r1'),
                              new Requirement('r2', ['r1']),
                              new Requirement('r3', ['r2'])]);
        let requirementIds = rSet.getRequirementIds();
        expect(new Set(requirementIds)).to.deep.equal(new Set(['r1', 'r2', 'r3']));
    });

    it('can collect requirements', () => {
        const rSet = new RequirementSet();
        rSet.addRequirements([new Requirement('r1'),
                              new Requirement('r2', ['r1']),
                              new Requirement('r3', ['r2'])]);
        let requirements = rSet.collectRequirements('r3');
        expect(requirements).to.deep.equal([rSet.getRequirement('r1'),
                                            rSet.getRequirement('r2'),
                                            rSet.getRequirement('r3')]);
    });

    it('can resolve requirements', () => {
        const rSet = new RequirementSet();
        rSet.addRequirements([new Requirement('r1'),
                              new Requirement('r2', ['r1']),
                              new Requirement('r3', ['r2'])]);
        let promise = rSet.fulfillRequirement('r3');
        return expect(promise).to.eventually.be.fulfilled;
    });

    it('does use progress callback', () => {
        const rSet = new RequirementSet();

        class MyRequirement extends Requirement {

            fulfilled(context: RequirementContext, progress: RequirementProgressHandler): Promise<boolean> {
                return Promise.resolve().then(() => {
                    progress({message: `checking ${this.name}`});
                    return false;
                });
            }

            fulfill(context: RequirementContext, progress: RequirementProgressHandler): Promise<any> {
                return Promise.resolve().then(() => {
                    progress({message: `fulfilling ${this.name}`});
                });
            }
        }

        rSet.addRequirements([new MyRequirement('r1'),
                              new MyRequirement('r2', ['r1']),
                              new MyRequirement('r3', ['r2'])]);

        let progressTrace = [];
        let onProgress = (progress) => {
            progressTrace.push(progress);
        };

        let promise = rSet.fulfillRequirement('r3', onProgress).then(() => progressTrace);
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
    describe('RequirementSet failures', function () {

        class MyRequirementFailingOnR3 extends Requirement {

            fulfilled(context: RequirementContext, progress: RequirementProgressHandler): Promise<boolean> {
                return Promise.resolve().then(() => {
                    progress({message: `checking ${this.name} files exist`});
                    return false;
                });
            }

            fulfill(context: RequirementContext, progress: RequirementProgressHandler): Promise<any> {
                return Promise.resolve().then(() => {
                    progress({message: `adding ${this.name} files`});
                    if (this.name === 'r3') {
                        throw new Error('disk full');
                    }
                });
            }

            rollback(context: RequirementContext, progress: RequirementProgressHandler): Promise<any> {
                return Promise.resolve().then(() => {
                    progress({message: `removing ${this.name} files`});
                });
            }
        }

        it('will be rejected', () => {
            const rSet = new RequirementSet();
            rSet.addRequirements([new MyRequirementFailingOnR3('r1'),
                                  new MyRequirementFailingOnR3('r2', ['r1']),
                                  new MyRequirementFailingOnR3('r3', ['r2'])]);
            return rSet.fulfillRequirement('r3').should.be.rejected;
        });

        it('will rollback', () => {
            const rSet = new RequirementSet();
            rSet.addRequirements([new MyRequirementFailingOnR3('r1'),
                                  new MyRequirementFailingOnR3('r2', ['r1']),
                                  new MyRequirementFailingOnR3('r3', ['r2'])]);

            let progressTrace = [];
            let onProgress = (progress) => {
                progressTrace.push(progress);
            };

            let promise = rSet.fulfillRequirement('r3', onProgress).catch(() => progressTrace);
            let expectedError = new RequirementError(rSet.getRequirement('r3'), 2, new Error('disk full'));

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
