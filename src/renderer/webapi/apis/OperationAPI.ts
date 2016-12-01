import {WebAPIClient} from "../WebAPIClient";
import {JobPromise} from "../Job";

export class OperationAPI {
    private webAPI: WebAPIClient;

    constructor(webAPI: WebAPIClient) {
        this.webAPI = webAPI;
    }

    getOperations(): JobPromise {
        return this.webAPI.call('getOperations', []);
    }
}
