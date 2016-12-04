export const APPLY_INITIAL_STATE = 'APPLY_INITIAL_STATE';
export const SET_WEBAPI_STATUS = 'SET_WEBAPI_STATUS';

export const UPDATE_DATA_STORES = 'UPDATE_DATA_STORES';
export const UPDATE_DATA_SOURCES = 'UPDATE_DATA_SOURCES';
export const UPDATE_OPERATIONS = 'UPDATE_OPERATIONS';

export const SET_SELECTED_DATA_STORE_INDEX = 'SET_SELECTED_DATA_STORE_INDEX';
export const SET_SELECTED_DATA_SOURCE_INDEX = 'SET_SELECTED_DATA_SOURCE_INDEX';
export const SET_SELECTED_OPERATION_NAME = 'SET_SELECTED_OPERATION_NAME';
export const SET_OPERATION_FILTER_TAGS = 'SET_OPERATION_FILTER_TAGS';
export const SET_OPERATION_FILTER_EXPR = 'SET_OPERATION_FILTER_EXPR';

export function applyInitialState(initialState: Object) {
    return {type: APPLY_INITIAL_STATE, payload: {initialState}};
}

export function setWebAPIStatus(webAPIClient, webAPIStatus: 'connecting'|'open'|'error'|'closed') {
    return {type: SET_WEBAPI_STATUS, payload: {webAPIClient, webAPIStatus}};
}

export function updateDataStores(dataStores) {
    return {type: UPDATE_DATA_STORES, payload: {dataStores}};
}

export function updateDataSources(dataStoreIndex: number, dataSources) {
    return {type: UPDATE_DATA_SOURCES, payload: {dataStoreIndex, dataSources}};
}

export function updateOperations(operations) {
    return {type: UPDATE_OPERATIONS, payload: {operations}};
}

export function setSelectedDataStoreIndex(selectedDataStoreIndex: number) {
    return {type: SET_SELECTED_DATA_STORE_INDEX, payload: {selectedDataStoreIndex}};
}

export function setSelectedDataSourceIndex(selectedDataSourceIndex: number) {
    return {type: SET_SELECTED_DATA_SOURCE_INDEX, payload: {selectedDataSourceIndex}};
}

export function setSelectedOperationName(selectedOperationName: string) {
    return {type: SET_SELECTED_OPERATION_NAME,  payload: {selectedOperationName}};
}

export function setOperationFilterTags(operationFilterTags: Array<string>) {
    return {type: SET_OPERATION_FILTER_TAGS,  payload: {operationFilterTags}};
}

export function setOperationFilterExpr(operationFilterExpr: Array<string>) {
    return {type: SET_OPERATION_FILTER_EXPR,  payload: {operationFilterExpr}};
}
