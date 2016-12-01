import {WebAPIClient} from "../WebAPIClient";
import {JobPromise} from "../Job";

export class DatasetAPI {
    private webAPI: WebAPIClient;

    constructor(webAPI: WebAPIClient) {
        this.webAPI = webAPI;
    }

    getDataStores(): JobPromise {
        return this.webAPI.call('getDataStores', []);
    }

    getDataSources(dataStoreId: string): JobPromise {
        return this.webAPI.call('getDataSources', [dataStoreId]);
    }
}
