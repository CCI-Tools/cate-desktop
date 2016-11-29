import {JobPromise, WebAPI} from "./webapi";

export class OperationAPI {
    private webAPI: WebAPI;

    constructor(webAPI: WebAPI) {
        this.webAPI = webAPI;
    }

    getOperations(): JobPromise {
        return this.webAPI.call('getOperations', []);
    }
}
