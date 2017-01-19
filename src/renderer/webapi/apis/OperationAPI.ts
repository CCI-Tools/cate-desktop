import {WebAPIClient} from "../WebAPIClient";
import {JobPromise, JobProgress, JobResponse} from "../Job";
import {OperationState, OperationInputState, OperationOutputState} from "../../state";

function responseToOperation(operationsResponse: JobResponse): OperationState[] {
    return operationsResponse ? operationsResponse.map(responseOperationToOperation) : null;
}

function responseOperationToOperation(op: any): OperationState {
    return {
        qualifiedName: op.qualified_name,
        name: (op.name || op.qualified_name),
        description: (op.header.description || null),
        tags: (op.header.tags || []),
        hasMonitor: (op.has_monitor || false),
        inputs: op.input.map(responseInputToOperationInput),
        outputs: op.output.map(responseOutputToOperationOutput),
    }
}

function responseInputToOperationInput(input: any): OperationInputState {
    return {
        name: input.name,
        dataType: input.data_type,
        description: (input.description || null),
        /* optional properties used mainly for validation */
        defaultValue: input.default_value,
        nullable: input.nullable,
        valueSet: input.value_set,
        valueRange: input.value_range,
    };
}

function responseOutputToOperationOutput(output: any): OperationOutputState {
    return {
        name: output.name,
        dataType: output.data_type,
        description: (output.description || null),
    };
}

export class OperationAPI {
    private webAPIClient: WebAPIClient;

    constructor(webAPI: WebAPIClient) {
        this.webAPIClient = webAPI;
    }

    getOperations(): JobPromise {
        return this.webAPIClient.call('get_operations', [], null, responseToOperation);
    }

    callOperation(opName: string, opParams: any, onProgress: (progress: JobProgress) => void): JobPromise {
        return this.webAPIClient.call('call_operation', [opName, opParams], onProgress);
    }
}
