import {
    WorkspaceState, DataStoreState, TaskState, State, ResourceState, VariableImageLayerState,
    LayerState
} from "./state";
import {DatasetAPI} from "./webapi/apis/DatasetAPI";
import {JobProgress, JobFailure, JobStatusEnum} from "./webapi/Job";
import {WorkspaceAPI} from "./webapi/apis/WorkspaceAPI";

// TODO write tests for actions


const CANCELLED_CODE = 999;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Application-level actions

export const APPLY_INITIAL_STATE = 'APPLY_INITIAL_STATE';
export const SET_WEBAPI_STATUS = 'SET_WEBAPI_STATUS';
export const SET_DIALOG_STATE = 'SET_DIALOG_STATE';
export const SET_TASK_STATE = 'SET_TASK_STATE';
export const SET_CONTROL_STATE = 'SET_CONTROL_STATE';

export function applyInitialState(initialState: Object) {
    return {type: APPLY_INITIAL_STATE, payload: initialState};
}

export function setWebAPIStatus(webAPIClient, webAPIStatus: 'connecting'|'open'|'error'|'closed') {
    return {type: SET_WEBAPI_STATUS, payload: {webAPIClient, webAPIStatus}};
}

export function setDialogState(dialogId: string, dialogState: any) {
    return {type: SET_DIALOG_STATE, payload: {dialogId, dialogState}};
}

export function setTaskState(taskId: string, taskState: TaskState) {
    return {type: SET_TASK_STATE, payload: {taskId, taskState}};
}

export function setControlState(propertyName: string, value: any) {
    const payload = {};
    payload[propertyName] = value;
    return {type: SET_CONTROL_STATE, payload};
}

export function cancelJob(jobId: number) {
    return (dispatch, getState) => {
        const state: State = getState();
        // TODO jobSubmitted, jobDone ???
        state.data.appConfig.webAPIClient.cancel(jobId);
    }
}

function jobSubmitted(taskId: string, jobTitle: string, jobId: number) {
    return setTaskState(taskId, {status: JobStatusEnum.SUBMITTED, jobTitle: jobTitle, jobId: jobId});
}

function jobProgress(taskId: string, progress: JobProgress) {
    return setTaskState(taskId, {status: JobStatusEnum.IN_PROGRESS, progress});
}

function jobDone(taskId: string) {
    return setTaskState(taskId, {status: JobStatusEnum.DONE});
}

function jobFailed(taskId: string, failure: JobFailure) {
    console.error(failure);
    return setTaskState(taskId, {
        status: failure.code === CANCELLED_CODE ? JobStatusEnum.CANCELLED : JobStatusEnum.FAILED,
        failure
    });
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Data stores / data sources actions

export const UPDATE_DATA_STORES = 'UPDATE_DATA_STORES';
export const UPDATE_DATA_SOURCES = 'UPDATE_DATA_SOURCES';
export const SET_SELECTED_DATA_STORE_ID = 'SET_SELECTED_DATA_STORE_ID';
export const SET_SELECTED_DATA_SOURCE_ID = 'SET_SELECTED_DATA_SOURCE_ID';
export const SET_DATA_SOURCE_FILTER_EXPR = 'SET_DATA_SOURCE_FILTER_EXPR';

/**
 * Asynchronously load the available Cate data stores.
 *
 * @returns {(dispatch:any, getState:any)=>undefined}
 */
export function loadDataStores() {
    return (dispatch, getState) => {
        const taskId = 'dataStores';
        const jobTitle = "Loading Data Stores";

        const jobPromise = datasetAPI(getState()).getDataStores();
        const jobId = jobPromise.getJob().getRequest().id;
        dispatch(jobSubmitted(taskId, jobTitle, jobId));

        jobPromise.then((dataStores: Array<DataStoreState>) => {
            dispatch(updateDataStores(dataStores));
            dispatch(jobDone(taskId));
            if (dataStores && dataStores.length) {
                dispatch(setSelectedDataStoreId(dataStores[0].id));
            } else {
                dispatch(setSelectedDataStoreId(null));
            }
        }).catch(failure => {
            dispatch(jobFailed(taskId, failure));
        });
    }
}

function updateDataStores(dataStores: Array<DataStoreState>) {
    return {type: UPDATE_DATA_STORES, payload: {dataStores}};
}

/**
 * Asynchronously load data sources for given data store ID.
 *
 * @param dataStoreId
 * @returns {(dispatch:any, getState:any)=>undefined}
 */
export function loadDataSources(dataStoreId: string) {
    return (dispatch, getState) => {
        const taskId = 'dataSources_' + dataStoreId;
        const dataStore = getState().data.dataStores.find(dataStore => dataStore.id === dataStoreId);
        const jobTitle = "Loading Data Sources: " + dataStore.name;

        const jobPromise = datasetAPI(getState()).getDataSources(dataStoreId, (progress: JobProgress) => {
            dispatch(jobProgress(taskId, progress));
        });
        const jobId = jobPromise.getJob().getRequest().id;
        dispatch(jobSubmitted(taskId, jobTitle, jobId));
        jobPromise.then(dataSources => {
            dispatch(updateDataSources(dataStoreId, dataSources));
            dispatch(jobDone(taskId));
            if (dataSources && dataSources.length) {
                dispatch(setSelectedDataSourceId(dataSources[0].id));
            } else {
                dispatch(setSelectedDataSourceId(null));
            }
        }).catch(failure => {
            dispatch(jobFailed(taskId, failure));
        });
    }
}

function updateDataSources(dataStoreId: string, dataSources) {
    return {type: UPDATE_DATA_SOURCES, payload: {dataStoreId, dataSources}};
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

export function setDataSourceFilterExpr(dataSourceFilterExpr: string) {
    return {type: SET_DATA_SOURCE_FILTER_EXPR, payload: {dataSourceFilterExpr}};
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
        const taskId = 'dataStores';
        const jobTitle = "Loading Workspace";
        const jobId = workspacePromise.getJob().getRequest().id;
        dispatch(jobSubmitted(taskId, jobTitle, jobId));

        workspacePromise.then((workspace: WorkspaceState) => {
            dispatch(setCurrentWorkspace(workspace));
            dispatch(jobDone(taskId));
            if (workspace && workspace.workflow.steps.length > 0) {
                dispatch(setSelectedWorkspaceResourceId(workspace.workflow.steps[0].id));
            } else {
                dispatch(setSelectedWorkspaceResourceId(null));
            }
        }).catch(failure => {
            dispatch(jobFailed(taskId, failure));
        });
    }
}

export function setCurrentWorkspace(workspace: WorkspaceState) {
    return {type: SET_CURRENT_WORKSPACE, payload: {workspace}};
}

export function setSelectedWorkspaceResourceId(selectedWorkspaceResourceId: string) {
    return (dispatch, getState) => {
        dispatch(setSelectedWorkspaceResourceIdImpl(selectedWorkspaceResourceId));
        if (selectedWorkspaceResourceId && getState().data.workspace) {
            const resources: Array<ResourceState> = getState().data.workspace.resources;
            if (resources) {
                const resource = resources.find(res => res.name === selectedWorkspaceResourceId);
                if (resource && resource.variables) {
                    dispatch(setSelectedVariableName(resource.variables[0].name));
                }
            }
        }
    }
}

function setSelectedWorkspaceResourceIdImpl(selectedWorkspaceResourceId: string) {
    return {type: SET_SELECTED_WORKSPACE_RESOURCE_ID, payload: {selectedWorkspaceResourceId}};
}

//noinspection JSUnusedGlobalSymbols
export function setSelectedWorkflowStepId(selectedWorkflowStepId: string) {
    return {type: SET_SELECTED_WORKFLOW_STEP_ID, payload: {selectedWorkflowStepId}};
}

function workspaceAPI(state: State): WorkspaceAPI {
    return new WorkspaceAPI(state.data.appConfig.webAPIClient);
}

export function setWorkspaceResource(resName: string, opName: string, opArgs: any) {
    return (dispatch, getState) => {
        const baseDir = getState().data.workspace.baseDir;
        const taskId = 'workspace_' + resName + '=' + opName;

        const jobTitle = "Loading Workspace";
        const workspacePromise = workspaceAPI(getState()).setWorkspaceResource(baseDir, resName, opName, opArgs,
            (progress: JobProgress) => {
                dispatch(jobProgress(taskId, progress));
            });
        const jobId = workspacePromise.getJob().getRequest().id;

        dispatch(jobSubmitted(taskId, jobTitle, jobId));
        workspacePromise.then(workspace => {
            dispatch(jobDone(taskId));
            dispatch(setCurrentWorkspace(workspace));
            dispatch(setSelectedWorkspaceResourceId(resName));
        }).catch(failure => {
            dispatch(jobFailed(taskId, failure));
        });
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Variable actions

export const SET_SELECTED_VARIABLE_NAME = 'SET_SELECTED_VARIABLE_NAME';

export function setSelectedVariableName(selectedVariableName: string|null) {
    return (dispatch, getState) => {
        dispatch(setSelectedVariableNameImpl(selectedVariableName));
        const selectedWorkspaceResourceId = getState().control.selectedWorkspaceResourceId;
        // TODO: get default value from some mapping varName => {colorMapName, displayMin?, displayMax?, displayAlpha?}
        // TODO: get actual selected variable so we can test if this variable is displayable as imagery layer
        //       get additional variable info from WebAPI:
        //       class VariableInterpretation {
        //          spaceXDim?: number;
        //          spaceYDim?: number;
        //          timeDim?: number;
        //          layerDim?: number;
        //          colorMapName?: string;
        //          displayMin?: number;
        //          displayMax?: number;
        //          displayAlpha:? boolean;
        //       }
        if (selectedWorkspaceResourceId && selectedVariableName) {
            const variableImageLayerState = {
                id: 'selectedVariable',
                type: 'VariableImage' as any,
                name: selectedWorkspaceResourceId + '.' + selectedVariableName,
                show: true,
                resName: selectedWorkspaceResourceId,
                varName: selectedVariableName,
                colorMapName: 'jet',
                displayMin: 0,
                displayMax: 1000,
                displayAlpha: false,
                imageEnhancement: {
                    alpha: 1.0,
                    brightness: 1.0,
                    contrast: 1.0,
                    hue: 0.0,
                    saturation: 1.0,
                    gamma: 1.0,
                },
            };
            dispatch(updateLayer(variableImageLayerState));
            // TODO: replace this by a the ID of the layer that represents this variable
            dispatch(setSelectedLayerId('selectedVariable'));
        }
    }
}

function setSelectedVariableNameImpl(selectedVariableName: string|null) {
    return {type: SET_SELECTED_VARIABLE_NAME, payload: {selectedVariableName}};
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Layer actions

export const SET_SELECTED_LAYER_ID = 'SET_SELECTED_LAYER_ID';
export const UPDATE_LAYER = 'UPDATE_LAYER';

export function setSelectedLayerId(selectedLayerId: string|null) {
    return {type: SET_SELECTED_LAYER_ID, payload: {selectedLayerId}};
}

export function updateLayer(layer: LayerState) {
    return {type: UPDATE_LAYER, payload: {layer}};
}

