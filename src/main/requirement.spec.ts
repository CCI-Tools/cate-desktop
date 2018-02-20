import {expect} from 'chai';
import 'chai-as-promised';
import {
    RequirementSet,
    Requirement,
    RequirementError,
    RequirementContext,
    RequirementProgressHandler
} from './requirement';
import deepEqual = require("deep-equal");
import {isDefined} from "../common/types";

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
                                                        {worked: 0, totalWork: 3, done: false},
                                                        {name: 'r1'},
                                                        {message: "checking r1"},
                                                        {message: "fulfilling r1"},
                                                        {worked: 1, totalWork: 3, done: false},
                                                        {name: 'r2'},
                                                        {message: "checking r2"},
                                                        {message: "fulfilling r2"},
                                                        {worked: 2, totalWork: 3, done: false},
                                                        {name: 'r3'},
                                                        {message: "checking r3"},
                                                        {message: "fulfilling r3"},
                                                        {worked: 3, totalWork: 3, done: true},
                                                    ] as any);
    });

    it('can rollback', () => {
        const rSet = new RequirementSet();

        class MyRequirement extends Requirement {

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

        rSet.addRequirements([new MyRequirement('r1'),
                              new MyRequirement('r2', ['r1']),
                              new MyRequirement('r3', ['r2'])]);

        let progressTrace = [];
        let onProgress = (progress) => {
            progressTrace.push(progress);
        };

        let promise = rSet.fulfillRequirement('r3', onProgress).then(() => progressTrace);
        const expectedProgressTrace = [
            {worked: 0, totalWork: 3, done: false},
            {name: 'r1'},
            {message: 'checking r1 files exist'},
            {message: 'adding r1 files'},
            {worked: 1, totalWork: 3, done: false},
            {name: 'r2'},
            {message: 'checking r2 files exist'},
            {message: 'adding r2 files'},
            {worked: 2, totalWork: 3, done: false},
            {name: 'r3'},
            {message: 'checking r3 files exist'},
            {message: 'adding r3 files'},
            /*12*/{error: new RequirementError(rSet.getRequirement('r3'), 2, new Error('disk full'))},
            {name: 'Rolling back "r3"'},
            {message: 'removing r3 files'},
            {worked: 2, totalWork: 3, done: false},
            {name: 'Rolling back "r2"'},
            {message: 'removing r2 files'},
            {worked: 1, totalWork: 3, done: false},
            {name: 'Rolling back "r1"'},
            {message: 'removing r1 files'},
            {worked: 0, totalWork: 3, done: true},
        ];
        promise.then(r => console.log(r));

        expect(promise, "number of events").to.eventually.satisfy((actualProgressTrace) => {
            return actualProgressTrace.length === expectedProgressTrace.length;
        });

        expect(promise, "error at index 12").to.eventually.satisfy((actualProgressTrace) => {
            return isDefined(actualProgressTrace[12].error);
        });

        expect(promise, "all events are deeply equal").to.eventually.satisfy((actualProgressTrace) => {
            actualProgressTrace[12] = null;
            expectedProgressTrace[12] = null;
            return deepEqual(actualProgressTrace, expectedProgressTrace);
        });
    });
});
