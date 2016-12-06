import {State, DataState, LocationState, SessionState, CommunicationState, ControlState} from './state';
import * as actions from './actions';
import {combineReducers} from 'redux';

const initialDataState: DataState = {
    appConfig: {
        webAPIClient: null,
        webAPIConfig: {
            servicePort: -1,
            serviceAddress: '',
            restUrl: '',
            webSocketUrl: '',
        }
    },
    dataStores: null,
    operations: null,
    workspace: null,
};

const dataReducer = (state: DataState = initialDataState, action) => {
    switch (action.type) {
        case actions.APPLY_INITIAL_STATE:
            return Object.assign({}, state, {
                appConfig: Object.assign({}, action.payload.appConfig)
            });
        case actions.SET_WEBAPI_STATUS: {
            const webAPIClient = action.payload.webAPIClient;
            return Object.assign({}, state, {
                appConfig: Object.assign({}, state.appConfig, {webAPIClient})
            });
        }
        case actions.UPDATE_DATA_STORES: {
            const dataStores = action.payload.dataStores.slice();
            return Object.assign({}, state, {dataStores});
        }
        case actions.UPDATE_DATA_SOURCES: {
            const dataStoreId = action.payload.dataStoreId;
            const dataStoreIndex = state.dataStores.findIndex(dataStore => dataStore.id === dataStoreId);
            if (dataStoreIndex < 0) {
                throw Error('illegal data store ID: ' + dataStoreId);
            }
            const oldDataStore = state.dataStores[dataStoreIndex];
            const newDataSources = action.payload.dataSources.slice();
            const newDataStore = Object.assign({}, oldDataStore, {
                dataSources: newDataSources,
            });
            const newDataStores = state.dataStores.slice();
            newDataStores[dataStoreIndex] = newDataStore;
            return Object.assign({}, state, {
                dataStores: newDataStores
            });
        }
        case actions.UPDATE_OPERATIONS: {
            const newOperations = action.payload.operations;
            return Object.assign({}, state, {
                operations: newOperations,
            });
        }
    }

    return state;
};

const initialControlState: ControlState = {
    selectedDataStoreId: null,
    selectedDataSourceId: null,
    selectedOperationName: null,
    operationFilterTags: [],
    operationFilterExpr: '',
    selectedWorkflowStepId: null,
    selectedWorkflowResourceId: null,
};

const controlReducer = (state: ControlState = initialControlState, action) => {
    switch (action.type) {
        case actions.UPDATE_DATA_STORES: {
            const dataStores = action.payload.dataStores;
            return Object.assign({}, state, {
                selectedDataStoreId: (dataStores && dataStores.length) ? dataStores[0].id : null
            });
        }
        case actions.UPDATE_DATA_SOURCES: {
            const dataSources = action.payload.dataSources;
            return Object.assign({}, state, {
                selectedDataSourceId: (dataSources && dataSources.length) ? dataSources[0].id : null
            });
        }
        case actions.UPDATE_OPERATIONS: {
            const operations = action.payload.operations;
            return Object.assign({}, state, {
                selectedOperationName: (operations && operations.length) ? operations[0].name : null
            });
        }
        case actions.SET_SELECTED_DATA_STORE_ID:
        case actions.SET_SELECTED_DATA_SOURCE_ID:
        case actions.SET_SELECTED_OPERATION_NAME:
        case actions.SET_OPERATION_FILTER_TAGS:
        case actions.SET_OPERATION_FILTER_EXPR:
            return Object.assign({}, state, action.payload);
    }
    return state;
};

const initialSessionState: SessionState = {};

const sessionReducer = (state: SessionState = initialSessionState, action) => {
    switch (action.type) {
        case actions.APPLY_INITIAL_STATE:
            return Object.assign({}, state, action.payload.session);
    }
    return state;
};

const initialCommunicationState: CommunicationState = {
    webAPIStatus: null
};

const communicationReducer = (state: CommunicationState = initialCommunicationState, action) => {
    switch (action.type) {
        case actions.SET_WEBAPI_STATUS:
            return Object.assign({}, state, {webAPIStatus: action.payload.webAPIStatus})
    }
    return state;
};

const initialLocationState: LocationState = {
    webAPIStatus: null
};

//noinspection JSUnusedLocalSymbols
const locationReducer = (state: LocationState = initialLocationState, action) => {
    return state;
};

export const reducers = combineReducers<State>({
    data: dataReducer,
    control: controlReducer,
    session: sessionReducer,
    communication: communicationReducer,
    location: locationReducer,
});
