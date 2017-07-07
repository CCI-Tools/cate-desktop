import {WebAPIClient} from "../WebAPIClient";
import {JobPromise, JobProgress} from "../Job";
import {WorkspaceState, ImageStatisticsState, OperationKWArgs, ResourceState, VariableState} from "../../state";
import {EMPTY_ARRAY, EMPTY_OBJECT} from "../../selectors";
import {isDefined, isNumber, isUndefined} from "../../../common/types";

function responseToVariables(variablesResponse: any): VariableState[] {
    return (variablesResponse || EMPTY_ARRAY).map(v => {
        const attributes = v.attributes || EMPTY_OBJECT;
        let validMin = attributes['valid_min'];
        let validMax = attributes['valid_max'];
        const validRange = attributes['valid_range'];
        const rangeOk = isDefined(validRange) && validRange.length === 2;
        validMin = (!isNumber(validMin) && rangeOk && isNumber(validRange[0])) ? validRange[0] : validMin;
        validMax = (!isNumber(validMax) && rangeOk && isNumber(validRange[1])) ? validRange[1] : validMax;
        const units = attributes['units'];
        if (units === 'kelvin' || units === 'Kelvin') {
            const validMinMin = 270;
            const validMaxMax = validMinMin + 40;
            if (!isNumber(validMin) || validMin < validMinMin) {
                validMin = validMinMin;
            }
            if (!isNumber(validMax) || validMax > validMaxMax) {
                validMax = validMaxMax;
            }
        }
        return {
            ...v,
            units,
            validMin,
            validMax,
        };
    });
}

function responseToResources(resourcesResponse: any): ResourceState[] {
    return (resourcesResponse || EMPTY_ARRAY).map(r => {
        if (r.variables) {
            return {...r, variables: responseToVariables(r.variables)};
        }
        return r;
    });
}

function responseToWorkspace(workspaceResponse: any): WorkspaceState {
    if (!workspaceResponse) {
        return null;
    }
    return {
        baseDir: workspaceResponse.base_dir,
        description: workspaceResponse.description,
        isScratch: workspaceResponse.is_scratch,
        isModified: workspaceResponse.is_modified,
        isSaved: workspaceResponse.is_saved,
        workflow: workspaceResponse.workflow,
        resources: responseToResources(workspaceResponse.resources),
    };
}

export class WorkspaceAPI {
    private webAPIClient: WebAPIClient;

    constructor(webAPI: WebAPIClient) {
        this.webAPIClient = webAPI;
    }

    newWorkspace(baseDir: string | null): JobPromise<WorkspaceState> {
        return this.webAPIClient.call('new_workspace', [baseDir], null, responseToWorkspace);
    }

    openWorkspace(baseDir: string,
                  onProgress: (progress: JobProgress) => void): JobPromise<WorkspaceState> {
        return this.webAPIClient.call('open_workspace', [baseDir], onProgress, responseToWorkspace);
    }

    closeWorkspace(baseDir: string): JobPromise<null> {
        return this.webAPIClient.call('close_workspace', [baseDir]);
    }

    saveWorkspace(baseDir: string,
                  onProgress: (progress: JobProgress) => void): JobPromise<WorkspaceState> {
        return this.webAPIClient.call('save_workspace', [baseDir], onProgress, responseToWorkspace);
    }

    saveWorkspaceAs(baseDir: string, toDir: string,
                    onProgress: (progress: JobProgress) => void): JobPromise<WorkspaceState> {
        return this.webAPIClient.call('save_workspace_as', [baseDir, toDir], onProgress, responseToWorkspace);
    }

    cleanWorkspace(baseDir: string): JobPromise<WorkspaceState> {
        return this.webAPIClient.call('clean_workspace', [baseDir], null, responseToWorkspace);
    }

    setWorkspaceResource(baseDir: string, resName: string, opName: string, opArgs: OperationKWArgs,
                         onProgress: (progress: JobProgress) => void): JobPromise<WorkspaceState> {
        return this.webAPIClient.call('set_workspace_resource', [baseDir, resName, opName, opArgs],
            onProgress, responseToWorkspace);
    }

    renameWorkspaceResource(baseDir: string, resName: string, newResName: string): JobPromise<WorkspaceState> {
        return this.webAPIClient.call('rename_workspace_resource', [baseDir, resName, newResName], null, responseToWorkspace);
    }

    deleteWorkspaceResource(baseDir: string, resName: string): JobPromise<WorkspaceState> {
        return this.webAPIClient.call('delete_workspace_resource', [baseDir, resName], null, responseToWorkspace);
    }

    getWorkspaceVariableStatistics(baseDir: string, resName: string,
                                   varName: string, varIndex: Array<number> | null): JobPromise<ImageStatisticsState> {
        return this.webAPIClient.call('get_workspace_variable_statistics', [baseDir, resName, varName, varIndex]);
    }
}
