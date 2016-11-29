import {Job, WebAPI} from "./webapi";

export class DatasetAPI {
    private webAPI: WebAPI;

    constructor(webAPI: WebAPI) {
        this.webAPI = webAPI;
    }

    getDataStoreNames(): Job {
        return this.webAPI.call('getDataStoreNames', {});
    }
}
