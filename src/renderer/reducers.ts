import {State, AppState} from './state';
import * as actions from './actions';
import {combineReducers} from 'redux';

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
    if (action.type === actions.UPDATE_DATA_STORES) {
        const newDataStores = action.dataStores.slice();
        const newSelectedDataStoreIndex = (newDataStores.length > 0) ? 0 : -1;
        return Object.assign({}, state, {
            dataStores: newDataStores,
            selectedDataStoreIndex: newSelectedDataStoreIndex
        });
    } else if (action.type === actions.UPDATE_DATA_SOURCES) {
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
            dataStores: newDataStores
        });
    } else if (action.type === actions.UPDATE_OPERATIONS) {
        const newOperations = action.operations;
        const newSelectedOperationIndex = (newOperations.length > 0) ? 0 : -1;
        return Object.assign({}, state, {
            operations: newOperations,
            selectedOperationIndex: newSelectedOperationIndex
        });
    } else if (action.type === actions.SET_SELECTED_DATA_STORE_INDEX) {
        const newSelectedDataStoreIndex = action.index;
        return Object.assign({}, state, {
            selectedDataStoreIndex: newSelectedDataStoreIndex
        });
    } else if (action.type === actions.SET_SELECTED_DATA_SOURCE_INDEX) {
        const newSelectedDataSourceIndex = action.index;
        return Object.assign({}, state, {
            selectedDataSourceIndex: newSelectedDataSourceIndex
        });
    } else if (action.type === actions.SET_SELECTED_OPERATION_INDEX) {
        const newSelectedOperationIndex = action.index;
        return Object.assign({}, state, {
            selectedOperationIndex: newSelectedOperationIndex
        });
    }
    return state;
};

const webapiStatusReducer = (state = {}, action) => {
    if (action.type === actions.SET_WEBAPI_OPEN_STATUS) {
        return Object.assign({}, {status: action.status})
    }
    return state;
};

const appConfigReducer = (state = {}, action) => {
    if (action.type === actions.APPLY_INITIAL_STATE) {
        return Object.assign({}, action.initialState.appConfig);
    }
    return state;
};

const userPrefsReducer = (state = {}, action) => {
    if (action.type === actions.APPLY_INITIAL_STATE) {
        return Object.assign({}, action.initialState.userPrefs);
    }
    return state;
};

export const reducers = combineReducers<State>({
    app: appReducer,
    webapiStatus: webapiStatusReducer,
    appConfig: appConfigReducer,
    userPrefs: userPrefsReducer,
});
