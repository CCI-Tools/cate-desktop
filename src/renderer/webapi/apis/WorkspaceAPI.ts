import {WebAPIClient} from "../WebAPIClient";
import {JobPromise, JobResponse, JobProgress} from "../Job";
import {WorkspaceState} from "../../state";

function responseToWorkspace(workspaceResponse: JobResponse): WorkspaceState {
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
        resources: workspaceResponse.resources,
    };
}

export class WorkspaceAPI {
    private webAPIClient: WebAPIClient;

    constructor(webAPI: WebAPIClient) {
        this.webAPIClient = webAPI;
    }

    newWorkspace(): JobPromise {
        return this.webAPIClient.call('new_workspace', [], null, responseToWorkspace);
    }

    openWorkspace(baseDir: string): JobPromise {
        return this.webAPIClient.call('open_workspace', [baseDir], null, responseToWorkspace);
    }

    closeWorkspace(baseDir: string): JobPromise {
        return this.webAPIClient.call('close_workspace', [baseDir], null, responseToWorkspace);
    }

    saveWorkspace(baseDir: string): JobPromise {
        return this.webAPIClient.call('save_workspace', [baseDir], null, responseToWorkspace);
    }

    saveWorkspaceAs(baseDir: string, newBaseDir: string): JobPromise {
        return this.webAPIClient.call('save_workspace_as', [baseDir, newBaseDir], null, responseToWorkspace);
    }

    setWorkspaceResource(baseDir: string, resName: string, opName: string, opArgs: any,
                         onProgress: (progress: JobProgress) => void): JobPromise {
        return this.webAPIClient.call('set_workspace_resource',  [baseDir, resName, opName, opArgs],
            onProgress, responseToWorkspace);
    }
}
