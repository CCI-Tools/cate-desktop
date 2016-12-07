import {WebAPIClient} from "../WebAPIClient";
import {JobPromise, JobProgress} from "../Job";

export class OperationAPI {
    private webAPIClient: WebAPIClient;

    constructor(webAPI: WebAPIClient) {
        this.webAPIClient = webAPI;
    }

    getOperations(): JobPromise {
        return this.webAPIClient.call('getOperations', []);
    }

    callOperation(opName: string, opParams: any, onProgress: (progress: JobProgress) => void): JobPromise {
        return this.webAPIClient.call('callOperation', [opName, opParams], onProgress);
    }
}
