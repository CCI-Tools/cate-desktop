import {Job, WebAPI} from "./webapi";

export class WorkspaceAPI {
    private webAPI: WebAPI;

    constructor(webAPI: WebAPI) {
        this.webAPI = webAPI;
    }

    newWorkspace(path: string): Job {
        return this.webAPI.call('newWorkspace', {path: path});
    }
}
