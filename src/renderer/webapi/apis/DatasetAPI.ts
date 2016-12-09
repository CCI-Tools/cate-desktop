import {WebAPIClient} from "../WebAPIClient";
import {JobPromise, JobProgress} from "../Job";

export class DatasetAPI {
    private readonly webAPIClient: WebAPIClient;

    constructor(webAPIClient: WebAPIClient) {
        this.webAPIClient = webAPIClient;
    }

    getDataStores(): JobPromise {
        return this.webAPIClient.call('getDataStores', []);
    }

    getDataSources(dataStoreId: string, onProgress: (progress: JobProgress) => void): JobPromise {
        return this.webAPIClient.call('getDataSources', [dataStoreId], onProgress);
    }
}
