import {JobPromise, WebAPI} from "./webapi";

export class DatasetAPI {
    private webAPI: WebAPI;

    constructor(webAPI: WebAPI) {
        this.webAPI = webAPI;
    }

    getDataStoreNames(): JobPromise {
        return this.webAPI.call('getDataStoreNames', {});
    }
}
