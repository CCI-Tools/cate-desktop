import {WorkspaceState} from "./state";
export const APPLY_INITIAL_STATE = 'APPLY_INITIAL_STATE';
export const SET_WEBAPI_STATUS = 'SET_WEBAPI_STATUS';
export const SET_DIALOG_STATE = 'SET_DIALOG_STATE';

//////////////////////////////////////////////////////////////////
// Application-level actions

export function applyInitialState(initialState: Object) {
    return {type: APPLY_INITIAL_STATE, payload: initialState};
}

export function setWebAPIStatus(webAPIClient, webAPIStatus: 'connecting'|'open'|'error'|'closed') {
    return {type: SET_WEBAPI_STATUS, payload: {webAPIClient, webAPIStatus}};
}

export function setDialogState(dialogId: string, dialogState: any) {
    return {type: SET_DIALOG_STATE,  payload: {dialogId, dialogState}};
}

//////////////////////////////////////////////////////////////////
// Data stores / data sources actions

export const UPDATE_DATA_STORES = 'UPDATE_DATA_STORES';
export const UPDATE_DATA_SOURCES = 'UPDATE_DATA_SOURCES';
export const SET_SELECTED_DATA_STORE_ID = 'SET_SELECTED_DATA_STORE_ID';
export const SET_SELECTED_DATA_SOURCE_ID = 'SET_SELECTED_DATA_SOURCE_ID';

export function updateDataStores(dataStores) {
    return {type: UPDATE_DATA_STORES, payload: {dataStores}};
}

export function updateDataSources(dataStoreId: string, dataSources) {
    return {type: UPDATE_DATA_SOURCES, payload: {dataStoreId, dataSources}};
}

export function setSelectedDataStoreId(selectedDataStoreId: string|null) {
    return {type: SET_SELECTED_DATA_STORE_ID, payload: {selectedDataStoreId}};
}

export function setSelectedDataSourceId(selectedDataSourceId: string|null) {
    return {type: SET_SELECTED_DATA_SOURCE_ID, payload: {selectedDataSourceId}};
}

//////////////////////////////////////////////////////////////////
// Operation actions

export const UPDATE_OPERATIONS = 'UPDATE_OPERATIONS';
export const SET_SELECTED_OPERATION_NAME = 'SET_SELECTED_OPERATION_NAME';
export const SET_OPERATION_FILTER_TAGS = 'SET_OPERATION_FILTER_TAGS';
export const SET_OPERATION_FILTER_EXPR = 'SET_OPERATION_FILTER_EXPR';

export function updateOperations(operations) {
    return {type: UPDATE_OPERATIONS, payload: {operations}};
}

export function setSelectedOperationName(selectedOperationName: string|null) {
    return {type: SET_SELECTED_OPERATION_NAME,  payload: {selectedOperationName}};
}

export function setOperationFilterTags(operationFilterTags: Array<string>) {
    return {type: SET_OPERATION_FILTER_TAGS,  payload: {operationFilterTags}};
}

export function setOperationFilterExpr(operationFilterExpr: Array<string>) {
    return {type: SET_OPERATION_FILTER_EXPR,  payload: {operationFilterExpr}};
}

//////////////////////////////////////////////////////////////////
// Workspace actions

export const SET_CURRENT_WORKSPACE = 'SET_CURRENT_WORKSPACE';

export function setCurrentWorkspace(workspace: WorkspaceState) {
    return {type: SET_CURRENT_WORKSPACE,  payload: {workspace}};
}



