import {FileExecOutput} from "../main/fileutil";

export interface RequirementProgress extends FileExecOutput {
    name?: string;
    worked?: number;
    totalWork?: number;
    subWorked?: number;
    done?: boolean;
    error?: RequirementError;
}

export type RequirementProgressHandler = (progress: RequirementProgress) => any;

export type RequirementState = { [key: string]: any };

export interface RequirementContext {
    getRequirementState(requirementId: string): RequirementState;

    getRequirement(requirementId: string): Requirement;
}

export class Requirement {
    readonly id: string;
    readonly requires: string[];
    readonly name: string;

    constructor(id: string, requires?: string[], name?: string) {
        this.id = id;
        this.requires = requires || [];
        this.name = name || id;
    }

    // noinspection JSMethodCanBeStatic
    newInitialState(context: RequirementContext): RequirementState {
        return {};
    }

    getState(context: RequirementContext): RequirementState {
        return context.getRequirementState(this.id);
    }

    ensureFulfilled(context: RequirementContext, onProgress: RequirementProgressHandler): Promise<any> {
        return this.fulfilled(context, onProgress).then(isFulfilled => {
            if (!isFulfilled) {
                //console.log(`"${this.name}" is not fulfilled`);
                return this.fulfill(context, onProgress);
            } else {
                //console.log(`"${this.name}" is already fulfilled`);
            }
        });
    }

    // noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
    fulfilled(context: RequirementContext, onProgress: RequirementProgressHandler): Promise<boolean> {
        return Promise.resolve(false);
    };

    // noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
    fulfill(context: RequirementContext, onProgress: RequirementProgressHandler): Promise<any> {
        return Promise.resolve();
    }

    // noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
    rollback(context: RequirementContext, onProgress: RequirementProgressHandler): Promise<any> {
        return Promise.resolve();
    }
}

export class RequirementError extends Error {
    readonly requirement: Requirement;
    readonly index: number;
    readonly reason: any;

    constructor(requirement: Requirement, index: number, reason: any) {
        super(`failed to fulfill requirement "${requirement.name}"`);
        this.requirement = requirement;
        this.index = index;
        this.reason = reason;
    }
}


export class RequirementSet implements RequirementContext {
    // noinspection JSUnusedLocalSymbols
    private static NO_PROGRESS_HANDLER: RequirementProgressHandler = (progress: RequirementProgress) => null;

    private _requirements: { [id: string]: Requirement };
    private _requirementStates: { [id: string]: RequirementState };

    constructor(requirements?: Requirement[]) {
        this._requirements = {};
        this._requirementStates = {};
        if (requirements) {
            this.addRequirements(requirements);
        }
    }

    getRequirementIds(): string[] {
        return Object.getOwnPropertyNames(this._requirements);
    }

    getRequirementState(requirementId: string): RequirementState {
        let state = this._requirementStates[requirementId];
        if (!state) {
            let requirement = this.getRequirement(requirementId);
            state = requirement.newInitialState(this);
            this._requirementStates[requirementId] = state;
        }
        return state;
    }

    getRequirement(requirementId: string): Requirement {
        const requirement = this._requirements[requirementId];
        if (!requirement) {
            throw new Error(`unknown requirement ID: "${requirementId}"`);
        }
        return requirement;
    }

    addRequirement(requirement: Requirement) {
        const oldRequirement = this._requirements[requirement.id];
        if (oldRequirement && oldRequirement !== requirement) {
            throw new Error(`requirement with ID "${requirement.id}" exists`);
        }
        this._requirements[requirement.id] = requirement;
    }

    addRequirements(requirements: Requirement[]) {
        for (let requirement of requirements) {
            this.addRequirement(requirement);
        }
    }

    collectRequirements(requirementId: string): Requirement[] {
        let requirement = this.getRequirement(requirementId);
        const collectedRequirements = [];
        this._collectRequirements(requirement, collectedRequirements);
        return collectedRequirements;
    }

    fulfillRequirement(requirementId: string, onProgress?: RequirementProgressHandler): Promise<any> {
        onProgress = onProgress || RequirementSet.NO_PROGRESS_HANDLER;
        this._requirementStates = {};
        const requirements = this.collectRequirements(requirementId);
        let fulfillSequence = this.newFulfillSequence(requirements, onProgress);
        return fulfillSequence.catch(reason => {
            if (!(reason instanceof RequirementError)) {
                throw reason;
            }
            return this.newRollbackSequence(requirements, reason, onProgress);
        });
    }

    private newFulfillSequence(requirements: Requirement[], onProgress: RequirementProgressHandler) {
        onProgress({worked: 0, totalWork: requirements.length, subWorked: 0, done: requirements.length === 0});
        let ensureFulfilledReducer = (p: Promise<void>, r: Requirement, i: number) => {
            //console.log(`adding ${r.name}`);
            return p.then(() => {
                onProgress({name: r.name});
                return r.ensureFulfilled(this, onProgress).then(value => {
                    onProgress({worked: i + 1, totalWork: requirements.length, subWorked: 0, done: i === requirements.length - 1});
                    return value;
                }).catch(reason => {
                    throw new RequirementError(r, i, reason);
                });
            });
        };
        return requirements.reduce(ensureFulfilledReducer, Promise.resolve());
    }

    private newRollbackSequence(requirements: Requirement[], error: RequirementError, onProgress: RequirementProgressHandler) {
        onProgress({error});
        const rollbackRequirements = requirements.slice(0, error.index + 1);
        let rollbackReducer = (p: Promise<void>, r: Requirement, i: number) => {
            //console.log(`adding ${r.name}`);
            return p.then(() => {
                onProgress({name: `Rolling back "${r.name}"`});
                return r.rollback(this, onProgress).then(value => {
                    onProgress({worked: i, totalWork: requirements.length, subWorked: 0, done: i === 0});
                    return value;
                });
            });
        };
        return rollbackRequirements.reduceRight(rollbackReducer, Promise.resolve());
    }

    private _collectRequirements(requirement: Requirement, collectedRequirements: Requirement[]): void {
        for (let otherRequirementId of requirement.requires) {
            const otherRequirement = this.getRequirement(otherRequirementId);
            this._collectRequirements(otherRequirement, collectedRequirements);
        }
        if (collectedRequirements.indexOf(requirement) === -1) {
            collectedRequirements.push(requirement);
        }
    }
}
