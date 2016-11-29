import {JobPromise, WebAPI} from "./webapi";

export class DatasetAPI {
    private webAPI: WebAPI;

    constructor(webAPI: WebAPI) {
        this.webAPI = webAPI;
    }

    getDataStores(): JobPromise {
        return this.webAPI.call('getDataStores', []);
    }

    getDataSources(dataStoreId: string): JobPromise {
        return this.webAPI.call('getDataSources', [dataStoreId]);
    }
}
