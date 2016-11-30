export const APPLY_INITIAL_STATE = 'APPLY_INITIAL_STATE';
export const SET_WEBAPI_OPEN_STATUS = 'SET_WEBAPI_OPEN_STATUS';

export const UPDATE_DATA_STORES = 'UPDATE_DATA_STORES';
export const UPDATE_DATA_SOURCES = 'UPDATE_DATA_SOURCES';
export const UPDATE_OPERATIONS = 'UPDATE_OPERATIONS';

export const SET_SELECTED_DATA_STORE_INDEX = 'SET_SELECTED_DATA_STORE_INDEX';
export const SET_SELECTED_DATA_SOURCE_INDEX = 'SET_SELECTED_DATA_SOURCE_INDEX';
export const SET_SELECTED_OPERATION_INDEX = 'SET_SELECTED_OPERATION_INDEX';

export function applyInitialState(initialState: Object) {
    return {type: APPLY_INITIAL_STATE, initialState};
}

export function setWebapiOpenStatus(status: string) {
    return {type: SET_WEBAPI_OPEN_STATUS, status};
}

export function updateDataStores(dataStores) {
    return {type: UPDATE_DATA_STORES, dataStores};
}

export function updateDataSources(dataStoreIndex: number, dataSources) {
    return {type: UPDATE_DATA_SOURCES, dataStoreIndex, dataSources};
}

export function updateOperations(operations) {
    return {type: UPDATE_OPERATIONS, operations};
}

export function setSelectedDataStoreIndex(index: number) {
    return {type: SET_SELECTED_DATA_STORE_INDEX, index};
}



//noinspection JSUnusedLocalSymbols
export function setSelectedOperationIndex(index: number) {
    return {type: SET_SELECTED_OPERATION_INDEX, index};
}

