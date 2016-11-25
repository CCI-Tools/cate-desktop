import {Job, WebAPI} from "./webapi";

export class WorkspaceAPI {
    private webAPI: WebAPI;

    constructor(webAPI: WebAPI) {
        this.webAPI = webAPI;
    }

    newWorkspace(path: string): Job {
        return this.webAPI.submit('newWorkspace', {path: path});
    }
}
