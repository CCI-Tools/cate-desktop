import {WebAPIClient} from "../WebAPIClient";
import {JobPromise} from "../Job";

export class WorkspaceAPI {
    private webAPI: WebAPIClient;

    constructor(webAPI: WebAPIClient) {
        this.webAPI = webAPI;
    }

    newWorkspace(path: string): JobPromise {
        return this.webAPI.call('newWorkspace', [path]);
    }

    openWorkspace(path: string): JobPromise {
        return this.webAPI.call('openWorkspace', [path]);
    }

    closeWorkspace(path: string): JobPromise {
        return this.webAPI.call('closeWorkspace', [path]);
    }

    saveWorkspace(path: string): JobPromise {
        return this.webAPI.call('saveWorkspace', [path]);
    }

    saveWorkspaceAs(path: string, newPath: string): JobPromise {
        return this.webAPI.call('saveWorkspaceAs', [path, newPath]);
    }
}
