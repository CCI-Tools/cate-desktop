import {
    WorkspaceState, DataStoreState, TaskState, State, ResourceState,
    LayerState, ColorMapCategoryState, ImageLayerState, ImageStatisticsState, DataSourceState,
    OperationState, SessionState, BackendConfigState, VariableState, VariableImageLayerState, VariableVectorLayerState,
    VariableRefState
} from "./state";
import {JobProgress, JobFailure, JobStatusEnum, JobPromise, JobProgressHandler} from "./webapi/Job";
import * as selectors from "./selectors";
import * as assert from "../common/assert";

// TODO (forman/marcoz): find easy way to unit-test our async actions calling remote API (WebAPIServiceMock?)

type NumberRange = [number, number];

const CANCELLED_CODE = 999;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Application-level actions

export const UPDATE_INITIAL_STATE = 'UPDATE_INITIAL_STATE';
export const SET_WEBAPI_STATUS = 'SET_WEBAPI_STATUS';
export const UPDATE_DIALOG_STATE = 'UPDATE_DIALOG_STATE';
export const UPDATE_TASK_STATE = 'UPDATE_TASK_STATE';
export const UPDATE_CONTROL_STATE = 'UPDATE_CONTROL_STATE';
export const UPDATE_SESSION_STATE = 'UPDATE_SESSION_STATE';

export function updateInitialState(initialState: Object) {
    return {type: UPDATE_INITIAL_STATE, payload: initialState};
}

export function setWebAPIStatus(webAPIClient, webAPIStatus: 'connecting'|'open'|'error'|'closed') {
    return {type: SET_WEBAPI_STATUS, payload: {webAPIClient, webAPIStatus}};
}

export function updateDialogState(dialogId: string, dialogState: any) {
    return {type: UPDATE_DIALOG_STATE, payload: {dialogId, dialogState}};
}

export function updateTaskState(jobId: number, taskState: TaskState) {
    return {type: UPDATE_TASK_STATE, payload: {jobId, taskState}};
}

export function setControlProperty(propertyName: string, value: any) {
    return updateControlState({[propertyName]: value});
}

export function updateControlState(controlState: any) {
    return {type: UPDATE_CONTROL_STATE, payload: controlState};
}

export function setPreferencesProperty(propertyName: string, value: any) {
    return updatePreferences({[propertyName]: value});
}

export function updatePreferences(session: any) {
    return (dispatch) => {
        dispatch(updateSessionState(session));
        dispatch(sendPreferencesToMain(session));
    };
}

export function updateSessionState(session: any) {
    return {type: UPDATE_SESSION_STATE, payload: session};
}

export function loadBackendConfig() {
    return (dispatch, getState) => {
        function call() {
            // Get state from the Python back-end
            return selectors.backendConfigAPISelector(getState()).getBackendConfig();
        }

        function action(backendConfig: BackendConfigState) {
            dispatch(updateBackendConfig(backendConfig));
        }

        callAPI(dispatch, 'Loading backend configuration', call, action);
    };
}

export function updateBackendConfig(backendConfig: BackendConfigState) {
    return updateSessionState({backendConfig});
}

export function storeBackendConfig(backendConfig: BackendConfigState) {
    return (dispatch, getState) => {
        function call() {
            // Store state changes to the Python back-end
            return selectors.backendConfigAPISelector(getState()).setBackendConfig(backendConfig);
        }

        callAPI(dispatch, 'Storing backend configuration', call);
    };
}

export function cancelJob(jobId: number) {
    return (dispatch, getState) => {
        const webAPIClient = selectors.webAPIClientSelector(getState());
        webAPIClient.cancel(jobId);
    }
}

function jobSubmitted(jobId: number, title: string) {
    return updateTaskState(jobId, {status: JobStatusEnum.SUBMITTED, title: title});
}

function jobProgress(progress: JobProgress) {
    return updateTaskState(progress.id, {status: JobStatusEnum.IN_PROGRESS, progress});
}

function jobDone(jobId: number) {
    return updateTaskState(jobId, {status: JobStatusEnum.DONE});
}

function jobFailed(jobId: number, failure: JobFailure) {
    const status = failure.code === CANCELLED_CODE ? JobStatusEnum.CANCELLED : JobStatusEnum.FAILED;
    if (status === JobStatusEnum.FAILED) {
        console.error(failure);
    }
    showMessageBox({
        type: "error",
        title: "Cate - Error",
        message: failure.message,
        detail: `An error (code ${failure.code}) occurred while executing a background process:\n\n${failure.data}`,
        buttons: [],
    }, MESSAGE_BOX_NO_REPLY);
    return updateTaskState(jobId, {status, failure});
}

export type JobPromiseFactory<T> = (jobProgressHandler: JobProgressHandler) => JobPromise<T>;
export type JobPromiseAction<T> = (jobResult: T) => void;

/**
 * Call some (remote) API asynchronously.
 *
 * @param dispatch Redux' dispatch() function.
 * @param title A human-readable title for the job that is being created
 * @param call The API call which must produce a JobPromise
 * @param action The action to be performed when the call succeeds.
 */
export function callAPI<T>(dispatch,
                           title: string,
                           call: JobPromiseFactory<T>,
                           action?: JobPromiseAction<T>): void {
    const onProgress = (progress: JobProgress) => {
        dispatch(jobProgress(progress));
    };

    const jobPromise = call(onProgress);
    dispatch(jobSubmitted(jobPromise.getJobId(), title));

    const onDone = (jobResult: T) => {
        dispatch(jobDone(jobPromise.getJobId()));
        if (action) {
            action(jobResult);
        }
    };
    const onFailure = jobFailure => {
        dispatch(jobFailed(jobPromise.getJobId(), jobFailure));
    };

    jobPromise.then(onDone, onFailure);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Data stores / data sources actions

export const UPDATE_DATA_STORES = 'UPDATE_DATA_STORES';
export const UPDATE_DATA_SOURCES = 'UPDATE_DATA_SOURCES';
export const UPDATE_DATA_SOURCE_TEMPORAL_COVERAGE = 'UPDATE_DATA_SOURCE_TEMPORAL_COVERAGE';

/**
 * Asynchronously load the available Cate data stores.
 * Called only a single time on app initialisation.
 *
 * @returns a Redux thunk action
 */
export function loadDataStores() {
    return (dispatch, getState) => {
        function call() {
            return selectors.datasetAPISelector(getState()).getDataStores();
        }

        function action(dataStores: DataStoreState[]) {
            dispatch(updateDataStores(dataStores));
            if (dataStores && dataStores.length) {
                dispatch(setSelectedDataStoreId(dataStores[0].id));
            } else {
                dispatch(setSelectedDataStoreId(null));
            }
        }

        callAPI(dispatch, 'Loading data stores', call, action);
    }
}


export function updateDataStores(dataStores: Array<DataStoreState>) {
    return {type: UPDATE_DATA_STORES, payload: {dataStores}};
}

/**
 * Asynchronously load data sources for given data store ID.
 *
 * @param dataStoreId
 * @returns a Redux thunk action
 */
export function loadDataSources(dataStoreId: string) {
    return (dispatch, getState) => {
        function call(onProgress) {
            return selectors.datasetAPISelector(getState()).getDataSources(dataStoreId, onProgress);
        }

        function action(dataSources: DataSourceState[]) {
            dispatch(updateDataSources(dataStoreId, dataSources));
            if (dataSources && dataSources.length) {
                dispatch(setSelectedDataSourceId(dataSources[0].id));
            } else {
                dispatch(setSelectedDataSourceId(null));
            }
        }

        const dataStore = getState().data.dataStores.find(dataStore => dataStore.id === dataStoreId);
        callAPI(dispatch, `Loading data sources for store "${dataStore ? dataStore.name : '?'}"`, call, action);
    }
}

export function updateDataSources(dataStoreId: string, dataSources) {
    return {type: UPDATE_DATA_SOURCES, payload: {dataStoreId, dataSources}};
}

export function setSelectedDataStoreId(selectedDataStoreId: string|null) {
    return (dispatch, getState) => {
        if (getState().control.selectedDataStoreId === selectedDataStoreId) {
            return;
        }
        dispatch(setSelectedDataStoreIdImpl(selectedDataStoreId));
        if (selectedDataStoreId !== null) {
            const dataStore = getState().data.dataStores.find(dataStore => dataStore.id === selectedDataStoreId);
            if (!dataStore.dataSources) {
                dispatch(loadDataSources(selectedDataStoreId));
            }
        }
    }
}

export function setSelectedDataStoreIdImpl(selectedDataStoreId: string|null) {
    return updateControlState({selectedDataStoreId});
}

export function setSelectedDataSourceId(selectedDataSourceId: string|null) {
    return updateControlState({selectedDataSourceId});
}

export function setDataSourceFilterExpr(dataSourceFilterExpr: string) {
    return updateControlState({dataSourceFilterExpr});
}

export function showOpenDatasetDialog(dataStoreId: string, dataSourceId: string, loadTimeInfo: boolean) {
    return (dispatch, getState) => {
        dispatch(updateDialogState('openDataset', {isOpen: true, timeInfoLoading: loadTimeInfo}));
        if (loadTimeInfo) {

            function call(onProgress) {
                return selectors.datasetAPISelector(getState()).getTemporalCoverage(dataStoreId, dataSourceId, onProgress);
            }

            function action(temporalCoverage) {
                dispatch(updateDataSourceTemporalCoverage(dataStoreId, dataSourceId, temporalCoverage));
            }

            callAPI(dispatch, `Loading temporal coverage for ${dataSourceId}`, call, action);
        }
    };
}

export function updateDataSourceTemporalCoverage(dataStoreId: string, dataSourceId: string, temporalCoverage: NumberRange) {
    return {type: UPDATE_DATA_SOURCE_TEMPORAL_COVERAGE, payload: {dataStoreId, dataSourceId, temporalCoverage}};
}


export function confirmOpenDatasetDialog(dataSourceId: string, args: any) {
    return (dispatch, getState: () => State) => {

        dispatch(updateDialogState('openDataset', {isOpen: false}));

        // TODO (forman): Handle case where action is called twice without completing the first.
        //                In this case the same resource name will be generated :(
        const resName = selectors.newResourceNameSelector(getState());
        const opName = 'open_dataset';
        const opArgs = {
            ds_name: dataSourceId,
            sync: true,
            ...args
        };

        // Wrap the opArgs into a new OpArgs object where each value is indicated by a "value" key.
        // The reason is that an opArg could also refer to a resource, the "source" key would be used instead.
        //
        const wrappedOpArgs = {};
        Object.keys(opArgs).forEach(name => {
            wrappedOpArgs[name] = {value: opArgs[name]};
        });

        dispatch(setWorkspaceResource(resName, opName, wrappedOpArgs,
            `Opening dataset "${resName}" from "${dataSourceId}"`));
    }
}

export function cancelOpenDatasetDialog() {
    return updateDialogState('openDataset', {isOpen: false});
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Operation actions

export const UPDATE_OPERATIONS = 'UPDATE_OPERATIONS';

export function loadOperations() {
    return (dispatch, getState: () => State) => {

        function call() {
            return selectors.operationAPISelector(getState()).getOperations();
        }

        function action(operations: OperationState[]) {
            dispatch(updateOperations(operations));
        }

        callAPI(dispatch, 'Loading operations', call, action);
    };
}

export function updateOperations(operations) {
    return {type: UPDATE_OPERATIONS, payload: {operations}};
}

export function setSelectedOperationName(selectedOperationName: string|null) {
    return updateControlState({selectedOperationName});
}

export function setOperationFilterTags(operationFilterTags: string[]) {
    return updateControlState({operationFilterTags});
}

export function setOperationFilterExpr(operationFilterExpr: string) {
    return updateControlState({operationFilterExpr});
}

export function showOperationStepDialog() {
    return (dispatch) => {
        dispatch(updateDialogState('operationStepDialog', {isOpen: true}));
    };
}

export function hideOperationStepDialog(inputAssignments?) {
    return (dispatch, getState) => {
        if (inputAssignments) {
            const dialogState = getState().control.dialogs['operationStepDialog'];
            inputAssignments = Object.assign({}, dialogState.inputAssignments, inputAssignments)
        }
        dispatch(updateDialogState('operationStepDialog', {isOpen: false, inputAssignments}));
    };
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Workspace actions

export const SET_CURRENT_WORKSPACE = 'SET_CURRENT_WORKSPACE';
export const RENAME_RESOURCE = 'RENAME_RESOURCE';

/**
 * Asynchronously load the initial workspace.
 * Called only a single time on app initialisation.
 *
 * @returns a Redux thunk action
 */
export function loadInitialWorkspace() {
    return (dispatch, getState) => {
        const reopenLastWorkspace = getState().session.reopenLastWorkspace;
        const lastWorkspacePath = getState().session.lastWorkspacePath;
        if (reopenLastWorkspace && lastWorkspacePath) {
            dispatch(openWorkspace(lastWorkspacePath));
        } else {
            dispatch(newWorkspace(null));
        }
    }
}

/**
 * Asynchronously create a new workspace.
 *
 * @param workspacePath workspace path, if null, a new scratch workspace will be created
 * @returns a Redux thunk action
 */
export function newWorkspace(workspacePath: string|null) {
    return (dispatch, getState) => {
        function call() {
            return selectors.workspaceAPISelector(getState()).newWorkspace(workspacePath);
        }

        function action(workspace: WorkspaceState) {
            dispatch(setCurrentWorkspace(workspace));
            if (workspace && workspace.workflow.steps.length > 0) {
                dispatch(setSelectedWorkspaceResourceId(workspace.workflow.steps[0].id));
            } else {
                dispatch(setSelectedWorkspaceResourceId(null));
            }
        }

        callAPI(dispatch, 'New workspace' + (workspacePath ? ` "${workspacePath}"` : ''), call, action);
    }
}

/**
 * Asynchronously open the a workspace.
 *
 * @param workspacePath workspace path
 * @returns a Redux thunk action
 */
export function openWorkspace(workspacePath?: string|null) {
    return (dispatch, getState) => {
        function call(onProgress) {
            return selectors.workspaceAPISelector(getState()).openWorkspace(workspacePath, onProgress);
        }

        function action(workspace: WorkspaceState) {
            dispatch(setCurrentWorkspace(workspace));
            if (workspace && workspace.workflow.steps.length > 0) {
                dispatch(setSelectedWorkspaceResourceId(workspace.workflow.steps[0].id));
            } else {
                dispatch(setSelectedWorkspaceResourceId(null));
            }
        }

        callAPI(dispatch, `Open workspace "${workspacePath}"`, call, action);
    }
}

/**
 * Asynchronously close the current workspace.
 *
 * @returns a Redux thunk action
 */
export function closeWorkspace() {
    return (dispatch, getState: () => State) => {
        const baseDir = selectors.workspaceBaseDirSelector(getState());
        assert.ok(baseDir);

        function call() {
            return selectors.workspaceAPISelector(getState()).closeWorkspace(baseDir);
        }

        function action() {
            dispatch(newWorkspace(null));
        }

        callAPI(dispatch, 'Close workspace', call, action);
    }
}

/**
 * Asynchronously close the current workspace.
 *
 * @returns a Redux thunk action
 */
export function saveWorkspace() {
    return (dispatch, getState: () => State) => {
        let workspace = getState().data.workspace;
        assert.ok(workspace);

        if (workspace.isScratch) {
            return saveWorkspaceAs;
        }

        const baseDir = workspace.baseDir;

        function call() {
            return selectors.workspaceAPISelector(getState()).saveWorkspace(baseDir);
        }

        function action(workspace: WorkspaceState) {
            dispatch(setCurrentWorkspace(workspace));
        }

        callAPI(dispatch, 'Save workspace', call, action);
    }
}

/**
 * Asynchronously close the current workspace.
 *
 * @returns a Redux thunk action
 */
export function saveWorkspaceAs(workspacePath: string) {
    return (dispatch, getState: () => State) => {
        const baseDir = selectors.workspaceBaseDirSelector(getState());
        assert.ok(baseDir);

        function call(onProgress) {
            return selectors.workspaceAPISelector(getState()).saveWorkspaceAs(baseDir, workspacePath, onProgress);
        }

        function action(workspace: WorkspaceState) {
            dispatch(setCurrentWorkspace(workspace));
        }

        callAPI(dispatch, `Save workspace as "${workspacePath}"`, call, action);
    }
}

/**
 * Asynchronously close the current workspace.
 *
 * @returns a Redux thunk action
 */
export function newWorkspaceInteractive() {
    return (dispatch, getState: () => State) => {
        const workspacePath = showSingleFileOpenDialog({
            title: "New Workspace - Select Directory",
            buttonLabel: "Select",
            properties: ['openDirectory', 'createDirectory'],
        });
        if (workspacePath) {
            const ok = maybeSaveWorkspace(dispatch, getState,
                "New Workspace",
                "Would you like to save the current workspace before creating a new one?",
                "Press \"Cancel\" to cancel creating a new workspace."
            );
            if (ok) {
                dispatch(newWorkspace(workspacePath));
            }
        }
    };
}

/**
 * Let user select a workspace directory, then ask whether to save the existing workspace, then open new one.
 *
 * @returns a Redux thunk action
 */
export function openWorkspaceInteractive() {
    return (dispatch, getState: () => State) => {
        const workspacePath = showSingleFileOpenDialog({
            title: "Open Workspace - Select Directory",
            buttonLabel: "Open",
            properties: ['openDirectory'],
        });
        if (workspacePath) {
            const workspace = getState().data.workspace;
            assert.ok(workspace);

            if (workspace.baseDir === workspacePath) {
                showMessageBox({title: 'Open Workspace', message: 'Workspace is already open.'}, MESSAGE_BOX_NO_REPLY);
                return;
            }

            const ok = maybeSaveWorkspace(dispatch, getState,
                "Open Workspace",
                "Would you like to save the current workspace before opening the new one?",
                "Press \"Cancel\" to cancel opening a new workspace."
            );
            if (ok) {
                dispatch(openWorkspace(workspacePath));
            }
        }
    };
}

/**
 * Ask user to whether to save workspace, then close it.
 *
 * @returns a Redux thunk action
 */
export function closeWorkspaceInteractive() {
    return (dispatch, getState: () => State) => {
        const ok = maybeSaveWorkspace(dispatch, getState,
            "Close Workspace",
            "Would you like to save the current workspace before closing it?",
            "Press \"Cancel\" to cancel closing the workspace."
        );
        if (ok) {
            dispatch(closeWorkspace())
        }
    };
}

/**
 * If current workspace is scratch workspace, delegate to "save as" action" otherwise save it.
 *
 * @returns a Redux thunk action
 */
export function saveWorkspaceInteractive() {
    return (dispatch, getState: () => State) => {
        const workspace = getState().data.workspace;
        if (workspace.isScratch) {
            dispatch(saveWorkspaceAsInteractive());
        } else {
            dispatch(saveWorkspace())
        }
    };
}

/**
 * Let user select a workspace directory, then save it.
 *
 * @returns a Redux thunk action
 */
export function saveWorkspaceAsInteractive() {
    return (dispatch) => {
        const workspacePath = showSingleFileOpenDialog({
            title: "Save Workspace As - Select Directory",
            buttonLabel: "Select",
            properties: ['openDirectory', 'createDirectory', 'promptToCreate'] as OpenDialogProperty[],
        });
        if (workspacePath) {
            dispatch(saveWorkspaceAs(workspacePath))
        }
    };
}

/**
 * Show a question box asking whether to save current workspace.
 *
 * @returns a Redux thunk action
 */
const maybeSaveWorkspace = function (dispatch, getState: () => State, title: string, message: string, detail?: string): boolean {
    const workspace = getState().data.workspace;
    const maySave = workspace.workflow.steps.length && (workspace.isModified || !workspace.isSaved);
    if (maySave) {
        const answer = showMessageBox({
            title,
            message,
            detail,
            buttons: ["Yes", "No", "Cancel"],
            defaultId: 0,
            cancelId: 2,
        });
        if (answer == 0) {
            if (workspace.isScratch) {
                dispatch(saveWorkspaceAsInteractive());
            } else {
                dispatch(saveWorkspace());
            }
        } else if (answer === 2) {
            return false;
        }
    }
    return true;
};

// setPreferencesProperty(

export function setCurrentWorkspace(workspace: WorkspaceState) {
    return (dispatch) => {
        dispatch(setCurrentWorkspaceImpl(workspace));
        if (!workspace.isScratch) {
            dispatch(updatePreferences({lastWorkspacePath: workspace.baseDir} as any));
        }
    }
}

function setCurrentWorkspaceImpl(workspace: WorkspaceState) {
    return {type: SET_CURRENT_WORKSPACE, payload: {workspace}};
}

export function setSelectedWorkspaceResourceId(selectedWorkspaceResourceId: string) {
    return (dispatch, getState) => {
        dispatch(setSelectedWorkspaceResourceIdImpl(selectedWorkspaceResourceId));
        if (selectedWorkspaceResourceId && getState().data.workspace) {
            const resources: Array<ResourceState> = getState().data.workspace.resources;
            if (resources) {
                const resource = resources.find(res => res.name === selectedWorkspaceResourceId);
                if (resource && resource.variables && resource.variables.length) {
                    dispatch(setSelectedVariableName(resource.variables[0].name));
                }
            }
        }
    }
}

function setSelectedWorkspaceResourceIdImpl(selectedWorkspaceResourceId: string) {
    return updateControlState({selectedWorkspaceResourceId});
}

//noinspection JSUnusedGlobalSymbols
export function setSelectedWorkflowStepId(selectedWorkflowStepId: string) {
    return updateControlState({selectedWorkflowStepId});
}

export function setWorkspaceResource(resName: string, opName: string, opArgs: {[name: string]: any}, title: string) {
    return (dispatch, getState) => {
        const baseDir = selectors.workspaceBaseDirSelector(getState());
        assert.ok(baseDir);

        function call(onProgress) {
            return selectors.workspaceAPISelector(getState()).setWorkspaceResource(baseDir, resName, opName, opArgs, onProgress);
        }

        function action(workspace: WorkspaceState) {
            dispatch(setCurrentWorkspace(workspace));
            dispatch(setSelectedWorkspaceResourceId(resName));
        }

        callAPI(dispatch, title, call, action);
    }
}

export function renameWorkspaceResource(resName: string, newResName: string) {
    return (dispatch, getState) => {
        const baseDir = selectors.workspaceBaseDirSelector(getState());
        assert.ok(baseDir);

        function call() {
            return selectors.workspaceAPISelector(getState()).renameWorkspaceResource(baseDir, resName, newResName);
        }

        function action(workspace: WorkspaceState) {
            dispatch(setCurrentWorkspace(workspace));
            dispatch(renameWorkspaceResourceImpl(resName, newResName));
        }

        callAPI(dispatch, 'Renaming resource', call, action);
    }
}

export function renameWorkspaceResourceImpl(resName: string, newResName: string) {
    return {type: RENAME_RESOURCE, payload: {resName, newResName}};
}

export function getWorkspaceVariableStatistics(resName: string,
                                               varName: string,
                                               varIndex: Array<number>,
                                               action: (statistics: ImageStatisticsState) => any) {
    return (dispatch, getState) => {
        const baseDir = selectors.workspaceBaseDirSelector(getState());
        assert.ok(baseDir);

        function call() {
            return selectors.workspaceAPISelector(getState()).getWorkspaceVariableStatistics(baseDir, resName, varName, varIndex);
        }

        function action2(statistics: ImageStatisticsState) {
            dispatch(action(statistics));
        }

        callAPI(dispatch, `Computing statistics for variable "${varName}"`, call, action2);
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Variable actions

export function setShowSelectedVariableLayer(showSelectedVariableLayer: boolean) {
    return (dispatch, getState) => {
        const layers = selectors.layersSelector(getState());
        const selectedVariableLayer = layers.find(l => l.id === SELECTED_VARIABLE_LAYER_ID);
        assert.ok(selectedVariableLayer);
        dispatch(updateLayer(selectedVariableLayer, {visible: showSelectedVariableLayer}));
        dispatch(setPreferencesProperty('showSelectedVariableLayer', showSelectedVariableLayer));
        // if we don't show layer for selected variable and selected layer is SELECTED_VARIABLE_LAYER_ID
        if (!showSelectedVariableLayer && getState().control.selectedLayerId === SELECTED_VARIABLE_LAYER_ID) {
            // deselect layer
            dispatch(setSelectedLayerId(null));
        }
    };
}

export function setSelectedVariableName(selectedVariableName: string|null) {
    return (dispatch, getState) => {
        dispatch(setSelectedVariableNameImpl(selectedVariableName));
        if (getState().session.showSelectedVariableLayer) {
            dispatch(updateSelectedVariableLayer());
        }
    }
}

export function updateSelectedVariableLayer() {
    return updateOrAddVariableLayer(SELECTED_VARIABLE_LAYER_ID);
}

export function addVariableLayer(layerId?: string|null, resource?: ResourceState, variable?: VariableState) {
    return updateOrAddVariableLayer(layerId, resource, variable);
}

export function getTileUrl(baseUrl: string, baseDir: string, layer: VariableImageLayerState): string {
    return baseUrl + `ws/res/tile/${encodeURIComponent(baseDir)}/${encodeURIComponent(layer.resName)}/{z}/{y}/{x}.png?`
        + `&var=${encodeURIComponent(layer.varName)}`
        + `&index=${encodeURIComponent((layer.varIndex || []).join())}`
        + `&cmap=${encodeURIComponent(layer.colorMapName) + (layer.alphaBlending ? '_alpha' : '')}`
        + `&min=${encodeURIComponent(layer.displayMin + '')}`
        + `&max=${encodeURIComponent(layer.displayMax + '')}`;
}

export function getGeoJSONUrl(baseUrl: string, baseDir: string, layer: VariableVectorLayerState): string {
    return baseUrl + `ws/res/geojson/${encodeURIComponent(baseDir)}/${encodeURIComponent(layer.resName)}?`
        + `&var=${encodeURIComponent(layer.varName)}`
        + `&index=${encodeURIComponent((layer.varIndex || []).join())}`
        + `&cmap=${encodeURIComponent(layer.colorMapName)}`
        + `&min=${encodeURIComponent(layer.displayMin + '')}`
        + `&max=${encodeURIComponent(layer.displayMax + '')}`;
}

export function getGeoJSONCountriesUrl(baseUrl: string): string {
    return baseUrl + 'ws/countries';
}

export function isSpatialImageVariable(variable: VariableState): boolean {
    return variable.ndim && variable.ndim >= 2 && !!variable.imageLayout;
}

export function isSpatialVectorVariable(variable: VariableState): boolean {
    return variable.isFeatureAttribute;
}

function createLayerId() {
    return Math.floor((1 + Math.random()) * 0x10000000).toString(16) + '-' + Math.floor(Date.now()).toString(16);
}

export function getLayerName(layer: LayerState): string {
    if (layer.name) {
        return layer.name;
    }
    const varName = (layer as any).varName;
    const resName = (layer as any).resName;
    if (layer.id === SELECTED_VARIABLE_LAYER_ID) {
        if (resName && varName) {
            return `Selected Variable (${resName} / ${varName})`;
        }
        return `Selected Variable (none)`;
    } else {
        if (resName && varName) {
            return `${resName} / ${varName}`;
        }
    }
    return layer.id;
}

export function findResource(resources: ResourceState[], ref: VariableRefState): ResourceState {
    return resources.find(r => r.name === ref.resName);
}

export function findVariable(resources: ResourceState[], ref: VariableRefState): VariableState {
    const resource = findResource(resources, ref);
    return resource && resource.variables.find(v => v.name === ref.varName);
}

export function updateOrAddVariableLayer(layerId?: string|null, resource?: ResourceState, variable?: VariableState) {
    return (dispatch, getState) => {
        resource = resource || selectors.selectedResourceSelector(getState());
        variable = variable || selectors.selectedVariableSelector(getState());
        if (!resource || !variable) {
            return;
        }
        let existingVariableLayer = null;
        if (layerId) {
            existingVariableLayer = getState().data.layers.find(layer => layer.id == layerId);
        } else {
            layerId = createLayerId();
        }
        let layerType;
        if (isSpatialImageVariable(variable)) {
            layerType = 'VariableImage';
        } else if (isSpatialVectorVariable(variable)) {
            layerType = 'VariableVector';
        }
        if (layerType) {
            const savedLayers = getState().control.savedLayers;
            const restoredLayer = savedLayers[variable.name];

            let layerDisplayProperties;
            let varIndex;
            if (restoredLayer) {
                varIndex = restoredLayer.varIndex && restoredLayer.varIndex.slice();
            } else {
                layerDisplayProperties = createVariableLayerDisplayProperties(variable);
            }

            if (variable.ndim >= 2 && (!varIndex || varIndex.length != variable.ndim - 2)) {
                varIndex = Array(variable.ndim - 2).fill(0);
            }

            const currentVariableLayer = Object.assign({}, restoredLayer, {
                id: layerId,
                type: layerType,
                visible: true,
                resName: resource.name,
                varName: variable.name,
                varIndex,
            }, layerDisplayProperties);

            if (existingVariableLayer) {
                dispatch(updateLayer(currentVariableLayer));
                if (existingVariableLayer.type === layerType
                    && existingVariableLayer.varName
                    && existingVariableLayer.varName !== currentVariableLayer.varName) {
                    dispatch(saveVariableLayer(existingVariableLayer.varName, existingVariableLayer));
                }
            } else {
                dispatch(addLayer(currentVariableLayer));
            }
            dispatch(setSelectedLayerId(currentVariableLayer.id));
        } else if (existingVariableLayer) {
            // instead of removing existingVariableLayer, we set its type to 'Unknown'
            const currentVariableLayer = {
                id: layerId,
                type: 'Unknown' as any,
                name: (resource && variable) ? `${variable.name} of ${resource.name}` : null,
                visible: true,
            };
            dispatch(replaceLayer(currentVariableLayer));
        }
    };
}

function isNumber(x) {
    return typeof x === 'number';
}

function createVariableLayerDisplayProperties(variable: VariableState) {
    return {
        colorMapName: 'jet',
        displayMin: isNumber(variable.valid_min) ? variable.valid_min : 0.,
        displayMax: isNumber(variable.valid_max) ? variable.valid_max : 1.,
        alphaBlending: false,
        opacity: 1.0,
        brightness: 1.0,
        contrast: 1.0,
        hue: 0.0,
        saturation: 1.0,
        gamma: 1.0,
    };
}

function setSelectedVariableNameImpl(selectedVariableName: string|null) {
    return updateControlState({selectedVariableName});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Layer actions

export const ADD_LAYER = 'ADD_LAYER';
export const REMOVE_LAYER = 'REMOVE_LAYER';
export const UPDATE_LAYER = 'UPDATE_LAYER';
export const REPLACE_LAYER = 'REPLACE_LAYER';
export const MOVE_LAYER_UP = 'MOVE_LAYER_UP';
export const MOVE_LAYER_DOWN = 'MOVE_LAYER_DOWN';
export const SAVE_LAYER = 'SAVE_LAYER';

export const SELECTED_VARIABLE_LAYER_ID = 'selectedVariable';
export const COUNTRY_BORDERS_LAYER_ID = 'countryBorders';

export function setSelectedLayerId(selectedLayerId: string|null) {
    return updateControlState({selectedLayerId});
}

export function addLayer(layer: LayerState) {
    return {type: ADD_LAYER, payload: {layer}};
}

export function removeLayer(id: string) {
    return {type: REMOVE_LAYER, payload: {id}};
}

export function moveLayerUp(id: string) {
    return {type: MOVE_LAYER_UP, payload: {id}};
}

export function moveLayerDown(id: string) {
    return {type: MOVE_LAYER_DOWN, payload: {id}};
}

export function updateLayer(layer: LayerState, ...layerSources) {
    if (layerSources.length) {
        layer = Object.assign({}, layer, ...layerSources);
    }
    return {type: UPDATE_LAYER, payload: {layer}};
}

export function replaceLayer(layer: LayerState) {
    return {type: REPLACE_LAYER, payload: {layer}};
}


/**
 * Save layer (in state.control), so it can later be restored.
 *
 * @param key
 * @param layer
 * @returns {{type: string, payload: {key: string, layer: LayerState}}}
 */
export function saveVariableLayer(key: string, layer: LayerState) {
    return {type: SAVE_LAYER, payload: {key, layer}};
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ColorMap actions

export const UPDATE_COLOR_MAPS = 'UPDATE_COLOR_MAPS';

/**
 * Asynchronously load the initial workspace.
 * Called only a single time on app initialisation.
 *
 * @returns a Redux thunk action
 */
export function loadColorMaps() {
    return (dispatch, getState: () => State) => {
        function call() {
            return selectors.colorMapsAPISelector(getState()).getColorMaps();
        }

        function action(colorMaps: Array<ColorMapCategoryState>) {
            dispatch(updateColorMaps(colorMaps));
        }

        callAPI(dispatch, 'Loading color maps', call, action);
    }
}

function updateColorMaps(colorMaps: Array<ColorMapCategoryState>) {
    return {type: UPDATE_COLOR_MAPS, payload: {colorMaps}};
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// (User) Preferences actions

export function showPreferencesDialog() {
    return updateDialogState('preferencesDialog', {isOpen: true});
}

export function hidePreferencesDialog() {
    return updateDialogState('preferencesDialog', {isOpen: false});
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Native, Electron-based dialogs, file choosers and message boxes

export interface FileFilter {
    name: string;
    extensions: string[];
}

export type OpenDialogProperty = 'openFile'|'openDirectory'|'multiSelections'|'createDirectory'|'showHiddenFiles';

/**
 * See dialog.showSaveDialog() in https://github.com/electron/electron/blob/master/docs/api/dialog.md
 */
export interface FileDialogOptions {
    title?: string;
    defaultPath?: string;
    /**
     * Custom label for the confirmation button, when left empty the default label will be used.
     */
    buttonLabel?: string;
    filters?: FileFilter[];
}

/**
 * See dialog.showSaveDialog() in https://github.com/electron/electron/blob/master/docs/api/dialog.md
 */
export interface SaveDialogOptions extends FileDialogOptions {
}

/**
 * See dialog.showOpenDialog() in https://github.com/electron/electron/blob/master/docs/api/dialog.md
 */
export interface OpenDialogOptions extends FileDialogOptions {
    /**
     * Contains which features the open dialog should use.
     */
    properties?: OpenDialogProperty[];
    /**
     * Normalize the keyboard access keys across platforms.
     * Default is false. Enabling this assumes & is used in the button labels for the placement of the
     * keyboard shortcut access key and labels will be converted so they work correctly on each platform,
     * & characters are removed on macOS, converted to _ on Linux, and left untouched on Windows.
     * For example, a button label of Vie&w will be converted to Vie_w on Linux and View on macOS and can
     * be selected via Alt-W on Windows and Linux.
     */
    normalizeAccessKeys?: boolean;
}

/**
 * See dialog.showMessageBox() in https://github.com/electron/electron/blob/master/docs/api/dialog.md
 */
export interface MessageBoxOptions {
    /**
     * Can be "none", "info", "error", "question" or "warning". On Windows, "question" displays the same icon as "info", unless you set an icon using the "icon" option.
     */
        type?: string;

    /**
     * Array of texts for buttons. On Windows, an empty array will result in one button labeled "OK".
     */
    buttons?: string[];

    /**
     * Title of the message box, some platforms will not show it.
     */
    title?: string;

    /**
     * Content of the message box.
     */
    message: string;

    /**
     * Extra information of the message.
     */
    detail?: string;

    /**
     *  NativeImage: https://github.com/electron/electron/blob/master/docs/api/native-image.md
     */
    icon?: any;

    /**
     * Index of the button in the buttons array which will be selected by default when the message box opens.
     */
    defaultId?: number;

    /**
     * The value will be returned when user cancels the dialog instead of clicking the buttons of the dialog.
     * By default it is the index of the buttons that have "cancel" or "no" as label, or 0 if there is no such buttons.
     * On macOS and Windows the index of the "Cancel" button will always be used as cancelId even if it is specified.
     */
    cancelId?: number;

    /**
     * On Windows Electron will try to figure out which one of the buttons are common buttons (like "Cancel" or "Yes"),
     * and show the others as command links in the dialog. This can make the dialog appear in the style of modern
     * Windows apps. If you don't like this behavior, you can set noLink to true.
     */
    noLink?: boolean;
}

/**
 * Shows a native file-open dialog.
 * Similar to "showFileOpenDialog" but will always return a single path or null.
 *
 * @param openDialogOptions the file-open dialog options, see https://github.com/electron/electron/blob/master/docs/api/dialog.md
 * @param callback an optional function which is called with the selected file path
 * @returns the selected file path or null, if no file path was selected or the callback function is defined
 */
export function showSingleFileOpenDialog(openDialogOptions: OpenDialogOptions,
                                         callback?: (filePath: string) => void): string|null {
    const getFirstFile = (filePaths: string[]) => (filePaths && filePaths.length) ? filePaths[0] : null;
    let callbackThunk;
    if (callback) {
        callbackThunk = (filePaths: string[]) => {
            return callback(getFirstFile(filePaths));
        };
    }
    return getFirstFile(showFileOpenDialog(openDialogOptions, callbackThunk));
}

//noinspection JSUnusedGlobalSymbols
/**
 * Shows a native file-open dialog.
 * Similar to "showFileOpenDialog" but will always return a single path or null.
 *
 * @param openDialogOptions the file-open dialog options, see https://github.com/electron/electron/blob/master/docs/api/dialog.md
 * @param callback an optional function which is called with the selected file path
 * @returns the selected file path or null, if no file path was selected or the callback function is defined
 */
export function showMultiFileOpenDialog(openDialogOptions: OpenDialogOptions,
                                        callback?: (filePaths: string[]) => void): string[]|null {
    if (openDialogOptions.properties && !openDialogOptions.properties.find((p) => p === 'multiSelections')) {
        const properties = openDialogOptions.properties.slice();
        properties.push('multiSelections');
        openDialogOptions = Object.assign({}, openDialogOptions, {properties});
    }
    return showFileOpenDialog(openDialogOptions, callback);
}

/**
 * Shows a native file-open dialog.
 *
 * @param openDialogOptions the file-open dialog options, see https://github.com/electron/electron/blob/master/docs/api/dialog.md
 * @param callback an optional function which is called with an array of the selected file paths
 * @returns the array of selected file paths or null, if no file path was selected or the callback function is defined
 */
export function showFileOpenDialog(openDialogOptions: OpenDialogOptions,
                                   callback?: (filePaths: string[]) => void): string[]|null {
    const electron = require('electron');
    if (!electron) {
        console.warn('showFileOpenDialog() cannot be executed, electron not available from renderer process');
        return;
    }
    const actionName = 'show-open-dialog';
    if (callback) {
        electron.ipcRenderer.send(actionName, openDialogOptions, false);
        electron.ipcRenderer.once(actionName + '-reply', (event, filePaths: string[]) => {
            callback(filePaths);
        });
        return null;
    } else {
        return electron.ipcRenderer.sendSync(actionName, openDialogOptions, true);
    }
}

/**
 * Shows a native file-save dialog.
 *
 * @param saveDialogOptions the file-save dialog options, see https://github.com/electron/electron/blob/master/docs/api/dialog.md
 * @param callback an optional function which is called with the selected file path
 * @returns the selected filePath or null, if no file path was selected or the callback function is defined
 */
export function showFileSaveDialog(saveDialogOptions: SaveDialogOptions, callback?: (filePath: string) => void): string|null {
    const electron = require('electron');
    if (!electron) {
        console.warn('showFileSaveDialog() cannot be executed, electron not available from renderer process');
        return;
    }
    const actionName = 'show-save-dialog';
    if (callback) {
        electron.ipcRenderer.send(actionName, saveDialogOptions, false);
        electron.ipcRenderer.once(actionName + '-reply', (event, filePath: string) => {
            callback(filePath);
        });
        return null;
    } else {
        return electron.ipcRenderer.sendSync(actionName, saveDialogOptions, true);
    }
}


export const MESSAGE_BOX_NO_REPLY = () => {
};

/**
 * Shows a native message box.
 *
 * @param messageBoxOptions the message dialog options, see https://github.com/electron/electron/blob/master/docs/api/dialog.md
 * @param callback an optional function which is called with the selected button index
 * @returns the selected button index or null, if no button was selected or the callback function is defined
 */
export function showMessageBox(messageBoxOptions: MessageBoxOptions, callback?: (index: number) => void): number|null {
    const electron = require('electron');
    if (!electron) {
        console.warn('showMessageBox() cannot be executed, electron not available from renderer process');
        return;
    }
    const actionName = 'show-message-box';
    if (!messageBoxOptions.buttons) {
        messageBoxOptions = Object.assign({}, messageBoxOptions, {buttons: ['OK']});
    }
    if (callback) {
        electron.ipcRenderer.send(actionName, messageBoxOptions, false);
        electron.ipcRenderer.once(actionName + '-reply', (event, index: number) => {
            callback(index);
        });
        return null;
    } else {
        return electron.ipcRenderer.sendSync(actionName, messageBoxOptions, true);
    }
}

/**
 * Update frontend preferences (but not backend configuration).
 *
 * @param session the session state to be stored
 * @param callback an optional function which is called with the selected button index
 * @returns the selected button index or null, if no button was selected or the callback function is defined
 */
export function sendPreferencesToMain(session: SessionState, callback?: (error: any) => void) {
    return () => {
        const electron = require('electron');
        if (!electron || !electron.ipcRenderer) {
            console.warn('sendPreferencesToMain() cannot be executed, electron/electron.ipcRenderer not available from renderer process');
            return;
        }
        const preferences = Object.assign({}, session);
        if (preferences.hasOwnProperty('backendConfig')) {
            delete preferences.backendConfig;
        }
        const actionName = 'set-preferences';
        electron.ipcRenderer.send(actionName, preferences);
        if (callback) {
            electron.ipcRenderer.once(actionName + '-reply', (event, error: any) => {
                callback(error);
            });
        }
    };
}



