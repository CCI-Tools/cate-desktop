import {WorkspaceState, DataStoreState, State} from "./state";
import {DatasetAPI} from "./webapi/apis/DatasetAPI";
import {JobStatus, JobProgress, JobFailure, JobStatusEnum} from "./webapi/Job";
import {WorkspaceAPI} from "./webapi/apis/WorkspaceAPI";

// TODO write tests for actions


const CANCELLED_CODE = 999;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Application-level actions

export const APPLY_INITIAL_STATE = 'APPLY_INITIAL_STATE';
export const SET_WEBAPI_STATUS = 'SET_WEBAPI_STATUS';
export const SET_DIALOG_STATE = 'SET_DIALOG_STATE';
export const SET_TASK_STATE = 'SET_TASK_STATE';

export function applyInitialState(initialState: Object) {
    return {type: APPLY_INITIAL_STATE, payload: initialState};
}

export function setWebAPIStatus(webAPIClient, webAPIStatus: 'connecting'|'open'|'error'|'closed') {
    return {type: SET_WEBAPI_STATUS, payload: {webAPIClient, webAPIStatus}};
}

export function setDialogState(dialogId: string, dialogState: any) {
    return {type: SET_DIALOG_STATE, payload: {dialogId, dialogState}};
}

export function setTaskState(taskId: string, taskState: any) {
    return {type: SET_TASK_STATE, payload: {taskId, taskState}};
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Data stores / data sources actions

export const UPDATE_DATA_STORES = 'UPDATE_DATA_STORES';
export const UPDATE_DATA_SOURCES = 'UPDATE_DATA_SOURCES';
export const SET_SELECTED_DATA_STORE_ID = 'SET_SELECTED_DATA_STORE_ID';
export const SET_SELECTED_DATA_SOURCE_ID = 'SET_SELECTED_DATA_SOURCE_ID';

/**
 * Asynchronously load the available Cate data stores.
 *
 * @returns {(dispatch:any, getState:any)=>undefined}
 */
export function loadDataStores() {
    return (dispatch, getState) => {
        dispatch(updateDataStoresSubmitted());
        datasetAPI(getState()).getDataStores().then((dataStores: Array<DataStoreState>) => {
            dispatch(updateDataStores(dataStores));
            dispatch(updateDataStoresDone());
            if (dataStores && dataStores.length) {
                dispatch(setSelectedDataStoreId(dataStores[0].id));
            } else {
                dispatch(setSelectedDataStoreId(null));
            }
        }).catch(failure => {
            console.error(failure);
            dispatch(updateDataStoresFailed(failure));
        });
    }
}

function updateDataStores(dataStores: Array<DataStoreState>) {
    return {type: UPDATE_DATA_STORES, payload: {dataStores}};
}

function updateDataStoresSubmitted() {
    // TODO update UI according to task state change: data stores panel, status bar, and task list panel
    return setTaskState('dataStores', {status: JobStatusEnum.SUBMITTED});
}

function updateDataStoresDone() {
    // TODO update UI according to task state change: data stores panel, status bar, and task list panel
    return setTaskState('dataStores', {status: JobStatusEnum.DONE});
}

function updateDataStoresFailed(failure) {
    // TODO update UI according to task state change: data stores panel, status bar, and task list panel
    return setTaskState('dataStores', {status: failure.code === CANCELLED_CODE ? JobStatusEnum.CANCELLED : JobStatusEnum.FAILED, failure});
}

/**
 * Asynchronously load data sources for given data store ID.
 *
 * @param dataStoreId
 * @returns {(dispatch:any, getState:any)=>undefined}
 */
export function loadDataSources(dataStoreId: string) {
    return (dispatch, getState) => {
        dispatch(updateDataSourcesSubmitted(dataStoreId));
        datasetAPI(getState()).getDataSources(dataStoreId, (progress: JobProgress) => {
            dispatch(updateDataSourcesProgress(dataStoreId, progress));
        }).then(dataSources => {
            dispatch(updateDataSources(dataStoreId, dataSources));
            dispatch(updateDataSourcesDone(dataStoreId));
            if (dataSources && dataSources.length) {
                dispatch(setSelectedDataSourceId(dataSources[0].id));
            } else {
                dispatch(setSelectedDataSourceId(null));
            }
        }).catch(failure => {
            console.error(failure);
            dispatch(updateDataSourcesFailed(dataStoreId, failure));
        });
    }
}

function updateDataSources(dataStoreId: string, dataSources) {
    return {type: UPDATE_DATA_SOURCES, payload: {dataStoreId, dataSources}};
}

function updateDataSourcesSubmitted(dataStoreId: string) {
    // TODO update UI according to task state change: data stores panel, status bar, and task list panel
    return setTaskState('dataSources_' + dataStoreId, {status: JobStatusEnum.SUBMITTED});
}

function updateDataSourcesProgress(dataStoreId: string, progress: JobProgress) {
    // TODO update UI according to task state change: data stores panel, status bar, and task list panel
    return setTaskState('dataSources_' + dataStoreId, {status: JobStatusEnum.IN_PROGRESS, progress});
}

function updateDataSourcesDone(dataStoreId: string) {
    // TODO update UI according to task state change: data stores panel, status bar, and task list panel
    return setTaskState('dataSources_' + dataStoreId, {status: JobStatusEnum.DONE});
}

function updateDataSourcesFailed(dataStoreId: string, failure: JobFailure) {
    // TODO update UI according to task state change: data stores panel, status bar, and task list panel
    return setTaskState('dataSources_' + dataStoreId, {status: failure.code === CANCELLED_CODE ? JobStatusEnum.CANCELLED : JobStatusEnum.FAILED, failure});
}

export function setSelectedDataStoreId(selectedDataStoreId: string|null) {
    return (dispatch, getState) => {
        if (getState().control.selectedDataStoreId === selectedDataStoreId) {
            return;
        }
        dispatch({type: SET_SELECTED_DATA_STORE_ID, payload: {selectedDataStoreId: selectedDataStoreId}});
        if (selectedDataStoreId !== null) {
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

function datasetAPI(state: State) {
    return new DatasetAPI(state.data.appConfig.webAPIClient);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Operation actions

export const UPDATE_OPERATIONS = 'UPDATE_OPERATIONS';
export const SET_SELECTED_OPERATION_NAME = 'SET_SELECTED_OPERATION_NAME';
export const SET_OPERATION_FILTER_TAGS = 'SET_OPERATION_FILTER_TAGS';
export const SET_OPERATION_FILTER_EXPR = 'SET_OPERATION_FILTER_EXPR';

export function updateOperations(operations) {
    return {type: UPDATE_OPERATIONS, payload: {operations}};
}

export function setSelectedOperationName(selectedOperationName: string|null) {
    return {type: SET_SELECTED_OPERATION_NAME, payload: {selectedOperationName}};
}

export function setOperationFilterTags(operationFilterTags: Array<string>) {
    return {type: SET_OPERATION_FILTER_TAGS, payload: {operationFilterTags}};
}

export function setOperationFilterExpr(operationFilterExpr: Array<string>) {
    return {type: SET_OPERATION_FILTER_EXPR, payload: {operationFilterExpr}};
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Workspace actions

export const SET_CURRENT_WORKSPACE = 'SET_CURRENT_WORKSPACE';
export const SET_SELECTED_WORKSPACE_RESOURCE_ID = 'SET_SELECTED_WORKSPACE_RESOURCE_ID';
export const SET_SELECTED_WORKFLOW_STEP_ID = 'SET_SELECTED_WORKFLOW_STEP_ID';

/**
 * Asynchronously load the available Cate data stores.
 *
 * @returns {(dispatch:any, getState:any)=>undefined}
 */
export function loadWorkspace() {
    return (dispatch, getState) => {
        const openLastWorkspace = getState().session.openLastWorkspace;
        const lastWorkspacePath = getState().session.lastWorkspacePath;

        let workspacePromise;
        if (openLastWorkspace && lastWorkspacePath) {
            workspacePromise = workspaceAPI(getState()).openWorkspace(lastWorkspacePath);
        } else {
            workspacePromise = workspaceAPI(getState()).newWorkspace();
        }

        dispatch(setCurrentWorkspaceSubmitted());
        workspacePromise.then((workspace: WorkspaceState) => {
            dispatch(setCurrentWorkspace(workspace));
            dispatch(setCurrentWorkspaceDone());
            if (workspace && workspace.workflow.steps.length > 0) {
                dispatch(setSelectedWorkspaceResourceId(workspace.workflow.steps[0].id));
            } else {
                dispatch(setSelectedWorkspaceResourceId(null));
            }
        }).catch(failure => {
            console.error(failure);
            dispatch(setCurrentWorkspaceFailed(failure));
        });
    }
}

export function setCurrentWorkspace(workspace: WorkspaceState) {
    return {type: SET_CURRENT_WORKSPACE, payload: {workspace}};
}

function setCurrentWorkspaceSubmitted() {
    // TODO update UI according to task state change: data stores panel, status bar, and task list panel
    return setTaskState('workspace', {status: JobStatusEnum.SUBMITTED});
}


function setCurrentWorkspaceDone() {
    // TODO update UI according to task state change: data stores panel, status bar, and task list panel
    return setTaskState('workspace', {status: JobStatusEnum.DONE});
}

function setCurrentWorkspaceFailed(failure: JobFailure) {
    // TODO update UI according to task state change: data stores panel, status bar, and task list panel
    return setTaskState('workspace', {status: failure.code === CANCELLED_CODE ? JobStatusEnum.CANCELLED : JobStatusEnum.FAILED, failure});
}

export function setSelectedWorkspaceResourceId(selectedWorkspaceResourceId: string) {
    return {type: SET_SELECTED_WORKSPACE_RESOURCE_ID, payload: {selectedWorkspaceResourceId}};
}

//noinspection JSUnusedGlobalSymbols
export function setSelectedWorkflowStepId(selectedWorkflowStepId: string) {
    return {type: SET_SELECTED_WORKFLOW_STEP_ID, payload: {selectedWorkflowStepId}};
}

function workspaceAPI(state: State): WorkspaceAPI {
    return new WorkspaceAPI(state.data.appConfig.webAPIClient);
}


