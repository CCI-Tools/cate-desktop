import {WebAPIClient} from "../WebAPIClient";
import {JobPromise, JobProgress} from "../Job";

export class OperationAPI {
    private webAPIClient: WebAPIClient;

    constructor(webAPI: WebAPIClient) {
        this.webAPIClient = webAPI;
    }

    getOperations(): JobPromise {
        return this.webAPIClient.call('get_operations', []);
    }

    callOperation(opName: string, opParams: any, onProgress: (progress: JobProgress) => void): JobPromise {
        return this.webAPIClient.call('call_operation', [opName, opParams], onProgress);
    }
}
