import {WorkspaceState, DataStoreState} from "./state";
import {DatasetAPI} from "./webapi/apis/DatasetAPI";
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

export const UPDATE_DATA_STORES_REQUEST = 'UPDATE_DATA_STORES_REQUEST';
export const UPDATE_DATA_STORES_SUCCESS = 'UPDATE_DATA_STORES_SUCCESS';
export const UPDATE_DATA_STORES_FAILURE = 'UPDATE_DATA_STORES_FAILURE';

export const SET_DATA_SOURCES = 'SET_DATA_SOURCES';
export const SET_SELECTED_DATA_STORE_ID = 'SET_SELECTED_DATA_STORE_ID';
export const SET_SELECTED_DATA_SOURCE_ID = 'SET_SELECTED_DATA_SOURCE_ID';

////////////////////////////////////////////
// data store
export function loadDataStores() {
    return (dispatch, getState) => {
        dispatch(updateDataStoresRequest());
        const datasetAPI = new DatasetAPI(getState().data.appConfig.webAPIClient);
        datasetAPI.getDataStores().then((dataStores: Array<DataStoreState>) => {
            dispatch(updateDataStoresSucess(dataStores));
            if (dataStores && dataStores.length) {
                dispatch(setSelectedDataStoreId(dataStores[0].id));
            } else {
                dispatch(setSelectedDataStoreId(null));
            }
        }).catch(error => {
            updateDataStoresFailure(error)
        });
    }
}

function updateDataStoresRequest() {
    // TODO start showing progress indicator ???
    return {type: UPDATE_DATA_STORES_REQUEST};
}
function updateDataStoresSucess(dataStores: Array<DataStoreState>) {
    // TODO stop showing progress indicator ???
    return {type: UPDATE_DATA_STORES_SUCCESS, payload: {dataStores}};
}
function updateDataStoresFailure(error) {
    // TODO: handle error
    return {type: UPDATE_DATA_STORES_FAILURE, payload: {error}};
}

export function loadDataSources(dataStoreId: string) {
    return (dispatch, getState) => {
        dispatch({type: "start_load_data_sources"}); // TODO
        const datasetAPI = new DatasetAPI(getState().data.appConfig.webAPIClient);
        datasetAPI.getDataSources(dataStoreId).then(dataSources => {
            dispatch({type: "done_load_data_sources"}); // TODO
            dispatch(setDataSources(dataStoreId, dataSources));
            if (dataSources && dataSources.length) {
                dispatch(setSelectedDataSourceId(dataSources[0].id));
            } else {
                dispatch(setSelectedDataSourceId(null));
            }
        }).catch(error => {
            dispatch({type: "error_load_data_sources"}); // TODO
            console.error(error);
        });
    }
}

function setDataSources(dataStoreId: string, dataSources) {
    return {type: SET_DATA_SOURCES, payload: {dataStoreId, dataSources}};
}

export function setSelectedDataStoreId(selectedDataStoreId: string|null) {
    return (dispatch, getState) => {
        if (getState().control.selectedDataStoreId == selectedDataStoreId) {
            return;
        }
        dispatch({type: SET_SELECTED_DATA_STORE_ID, payload: {selectedDataStoreId : selectedDataStoreId}});
        if (selectedDataStoreId != null) {
            const dataStore = getState().data.dataStores.find(dataStore => dataStore.id === selectedDataStoreId);
            if (!dataStore.dataSources) {
                dispatch(loadDataSources(selectedDataStoreId));
            }
        }
    }
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



