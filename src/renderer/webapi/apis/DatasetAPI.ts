import {WebAPIClient} from "../WebAPIClient";
import {JobPromise, JobProgress} from "../Job";

export class DatasetAPI {
    private readonly webAPIClient: WebAPIClient;

    constructor(webAPIClient: WebAPIClient) {
        this.webAPIClient = webAPIClient;
    }

    getDataStores(): JobPromise {
        return this.webAPIClient.call('get_data_stores', []);
    }

    getDataSources(dataStoreId: string, onProgress: (progress: JobProgress) => void): JobPromise {
        return this.webAPIClient.call('get_data_sources', [dataStoreId], onProgress);
    }
}
