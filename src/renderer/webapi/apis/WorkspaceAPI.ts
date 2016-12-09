import {WebAPIClient} from "../WebAPIClient";
import {JobPromise, JobResponse} from "../Job";
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
    };
}

export class WorkspaceAPI {
    private webAPIClient: WebAPIClient;

    constructor(webAPI: WebAPIClient) {
        this.webAPIClient = webAPI;
    }

    newWorkspace(): JobPromise {
        return this.webAPIClient.call('newWorkspace', [], null, responseToWorkspace);
    }

    openWorkspace(path: string): JobPromise {
        return this.webAPIClient.call('openWorkspace', [path], null, responseToWorkspace);
    }

    closeWorkspace(path: string): JobPromise {
        return this.webAPIClient.call('closeWorkspace', [path], null, responseToWorkspace);
    }

    saveWorkspace(path: string): JobPromise {
        return this.webAPIClient.call('saveWorkspace', [path], null, responseToWorkspace);
    }

    saveWorkspaceAs(path: string, newPath: string): JobPromise {
        return this.webAPIClient.call('saveWorkspaceAs', [path, newPath], null, responseToWorkspace);
    }

}
