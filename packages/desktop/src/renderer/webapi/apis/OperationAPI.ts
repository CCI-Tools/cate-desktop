import { WebAPIClient } from '../WebAPIClient';
import { JobPromise } from '../Job';
import { OperationInputState, OperationOutputState, OperationState } from '../../state';

function responseToOperations(operationsResponse: any): OperationState[] {
    return operationsResponse ? operationsResponse.map(responseOperationToOperation) : null;
}

function responseOperationToOperation(op: any): OperationState {
    return {
        qualifiedName: op.qualified_name,
        name: op.name || op.qualified_name,
        description: (op.header && op.header.description) || null,
        tags: (op.header && op.header.tags) || [],
        hasMonitor: (op.has_monitor || false),
        inputs: op.inputs.map(responseInputToOperationInput),
        outputs: op.outputs.map(responseOutputToOperationOutput),
    }
}

function responseInputToOperationInput(input: any): OperationInputState {
    return {
        name: input.name,
        dataType: input.data_type,
        description: (input.description || null),
        units: input.units,
        /* optional properties used mainly for validation */
        defaultValue: input.default_value,
        nullable: (input.nullable || input.default_value === null),
        valueSet: input.value_set,
        valueSetSource: input.value_set_source,
        valueRange: input.value_range,
        scriptLang: input.script_lang,
        fileOpenMode: input.file_open_mode,
        fileFilters: input.file_filters,
        fileProps: input.file_props,
        noUI: input.no_ui || input.step_id,
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

    getOperations(): JobPromise<OperationState[]> {
        return this.webAPIClient.call('get_operations', [], null, responseToOperations);
    }

    /*
    callOperation(opName: string, opParams: any, onProgress: (progress: JobProgress) => void): JobPromise<any> {
        return this.webAPIClient.call('call_operation', [opName, opParams], onProgress);
    }
    */
}
