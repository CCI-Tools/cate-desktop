export interface State {
    app: AppState;
    webapiStatus: any;
    appConfig: any;
    userPrefs: any;
}

export interface AppState {
    dataStores: Array<DataStoreState>;
    selectedDataStoreIndex: number;
    operations: Array<OperationState>;
    selectedOperationIndex: number;
    workspace: WorkspaceState;
}

export interface DataStoreState {
    id: string;
    name: string;
    description: string;
    dataSources: Array<DataSourceState>;
    selectedDataSourceIndex: number;
}

export interface DataSourceState {
    id: string;
    name: string;
    description: string;
}

export interface OperationState {
    name: string;
    description: Array<string>;
    tags: Array<string>;
    inputs: Array<OperationInputState>;
    outputs: Array<OperationOutputState>;
}

export interface OperationInputState {
    name: string;
    description: string;
    dataType: string;
    valueSet?: Array<any>;
    valueRange?: Array<any>;
}

export interface OperationOutputState {
    name: string;
    description: string;
    dataType: string;
}

export interface WorkspaceState {
    path: null;
    isOpen: boolean;
    isSaved: boolean;
}
