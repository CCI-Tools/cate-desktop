import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {createStore, combineReducers, applyMiddleware} from 'redux';
import * as logger from 'redux-logger';
import {Provider} from 'react-redux';
import {ipcRenderer} from 'electron';
import {Layout} from './components/Layout'
import {WebAPI, openWebAPI, WebSocketMock, WebAPIServiceMock} from './webapi'
import {OperationAPI} from "./webapi/OperationAPI";
import {DatasetAPI} from "./webapi/DatasetAPI";


function applyInitialState(initialState) {
    return {type: 'APPLY_INITIAL_STATE', initialState};
}

function setWebapiOpenStatus(status) {
    return {type: 'SET_WEBAPI_OPEN_STATUS', status};
}

function updateDataStores(dataStores) {
    return {type: 'UPDATE_DATA_STORES', dataStores};
}

function updateDataSources(dataStoreIndex, dataSources) {
    return {type: 'UPDATE_DATA_SOURCES', dataStoreIndex, dataSources};
}

function updateOperations(operations) {
    return {type: 'UPDATE_OPERATIONS', operations};
}

function setSelectedOperationIndex(selectedOperationIndex) {
    return {type: 'SET_SELECTED_OPERATION_INDEX', selectedOperationIndex};
}

interface State {
    app: AppState;
    webapiStatus: any;
    appConfig: any;
    userPrefs: any;
}

interface AppState {
    dataStores: Array<DataStoreState>;
    selectedDataStoreIndex: number;
    operations: Array<OperationState>;
    selectedOperationIndex: number;
    workspace: WorkspaceState;
}

interface DataStoreState {
    id: string;
    name: string;
    description: string;
    dataSources: Array<DataSourceState>;
    selectedDataSourceIndex: number;
}

interface DataSourceState {
    id: string;
    name: string;
    description: string;
}

interface OperationState {
    name: string;
    description: Array<string>;
    tags: Array<string>;
    inputs: Array<OperationInputState>;
    outputs: Array<OperationOutputState>;
}

interface OperationInputState {
    name: string;
    description: string;
    dataType: string;
    valueSet?: Array<any>;
    valueRange?: Array<any>;
}

interface OperationOutputState {
    name: string;
    description: string;
    dataType: string;
}

interface WorkspaceState {
    path: null;
    isOpen: boolean;
    isSaved: boolean;
}

const appReducer = (state: AppState, action) => {
    if (!state) {
        state = {
            dataStores: [],
            selectedDataStoreIndex: -1,
            operations: [],
            selectedOperationIndex: -1,
            workspace: null,
        };
    }
    if (action.type === 'UPDATE_DATA_STORES') {
        const newDataStores = action.dataStores.slice();
        const newSelectedDataStoreIndex = (newDataStores.length > 0) ? 0 : -1;
        return Object.assign({}, state, {
            dataStores: newDataStores,
            selectedDataStoreIndex: newSelectedDataStoreIndex
        });
    } else if (action.type === 'SET_SELECTED_DATA_STORE_INDEX') {
        const newSelectedDataStoreIndex = action.selectedDataStoreIndex;
        return Object.assign({}, state, {
            selectedDataStoreIndex: newSelectedDataStoreIndex
        });
    } else if (action.type === 'UPDATE_DATA_SOURCES') {
        const dataStoreIndex = action.dataStoreIndex;
        if (dataStoreIndex < 0 || dataStoreIndex >= state.dataStores.length) {
            throw Error('illegal data store index: ' + dataStoreIndex);
        }
        const newDataSources = action.dataSources.slice();
        const newSelectedDataSourceIndex = (newDataSources.length > 0) ? 0 : -1;
        const oldDataStore = state.dataStores[dataStoreIndex];
        const newDataStore = Object.assign({}, oldDataStore, {
            dataSources: newDataSources,
            selectedDataSourceIndex: newSelectedDataSourceIndex
        });
        const newDataStores = state.dataStores.slice();
        newDataStores[dataStoreIndex] = newDataStore;
        return Object.assign({}, state, {
            dataSources: newDataStores
        });
    } else if (action.type === 'SET_SELECTED_DATA_SOURCE_INDEX') {
        const newSelectedDataSourceIndex = action.selectedDataSourceIndex;
        return Object.assign({}, state, {
            selectedDataSourceIndex: newSelectedDataSourceIndex
        });
    } else if (action.type === 'UPDATE_OPERATIONS') {
        const newOperations = action.operations;
        const newSelectedOperationIndex = (newOperations.length > 0) ? 0 : -1;
        return Object.assign({}, state, {
            operations: newOperations,
            selectedOperationIndex: newSelectedOperationIndex
        });
    } else if (action.type === 'SET_SELECTED_OPERATION_INDEX') {
        const newSelectedOperationIndex = action.selectedOperationIndex;
        return Object.assign({}, state, {
            selectedOperationIndex: newSelectedOperationIndex
        });
    }
    return state;
};

const webapiStatusReducer = (state = {}, action) => {
    if (action.type === 'SET_WEBAPI_OPEN_STATUS') {
        return Object.assign({}, {status: action.status})
    }
    return state;
};

const appConfigReducer = (state = {}, action) => {
    if (action.type === 'APPLY_INITIAL_STATE') {
        return Object.assign({}, action.initialState.appConfig);
    }
    return state;
};

const userPrefsReducer = (state = {}, action) => {
    if (action.type === 'APPLY_INITIAL_STATE') {
        return Object.assign({}, action.initialState.userPrefs);
    }
    return state;
};

let webAPI = null;


export function main() {

    const reducers = combineReducers<State>({
        app: appReducer,
        webapiStatus: webapiStatusReducer,
        appConfig: appConfigReducer,
        userPrefs: userPrefsReducer,
    });

    const store = createStore(reducers, applyMiddleware(logger()));

    store.subscribe(() => {
        // console.log("store changed: ", store.getState());
    });

    ipcRenderer.on('apply-initial-state', (event, initialState) => {
        store.dispatch(applyInitialState(initialState));
        store.dispatch(setWebapiOpenStatus('connecting'));

        const webapiConfig = initialState.appConfig.webapiConfig;
        if (webapiConfig.disabled !== true && webapiConfig.webSocketUrl) {
            webAPI = openWebAPI(webapiConfig.webSocketUrl);
        } else {
            webAPI = openWebAPI('ws://mock', 0, new WebSocketMock(100, new WebAPIServiceMock()));
        }

        webAPI.onOpen = () => {
            store.dispatch(setWebapiOpenStatus('open'));
            const datasetAPI = new DatasetAPI(webAPI);
            const operationAPI = new OperationAPI(webAPI);
            datasetAPI.getDataStores().then(dataStores => {
                store.dispatch(updateDataStores(dataStores));
                let index = store.getState().app.selectedDataStoreIndex;
                if (index >= 0) {
                    datasetAPI.getDataSources(dataStores[index].id).then((dataSources => {
                        store.dispatch(updateDataSources(index, dataSources));
                    }));
                }
            });
            operationAPI.getOperations().then(operations => {
                store.dispatch(updateOperations(operations));
            });
        };
        webAPI.onClose = () => {
            store.dispatch(setWebapiOpenStatus('closed'));
        };
        webAPI.onError = () => {
            store.dispatch(setWebapiOpenStatus('error'));
        };
    });

    ReactDOM.render(
        <Provider store={store}>
            <Layout/>
        </Provider>,
        document.getElementById('container')
    );
}
