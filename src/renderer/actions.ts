import {
    WorkspaceState, DataStoreState, TaskState, ResourceState,
    LayerState, ColorMapCategoryState, ImageStatisticsState, DataSourceState,
    OperationState, BackendConfigState, VariableState,
    OperationKWArgs, WorldViewMode, SavedLayers, VariableLayerBase, State, GeographicPosition, MessageState, Placemark,
    SplitMode, WebAPIConfig, WebAPIStatus, WebAPIMode
} from './state';
import { ViewState, ViewPath } from './components/ViewState';
import {
    JobProgress,
    JobFailure,
    JobStatusEnum,
    JobPromise,
    JobProgressHandler,
    ERROR_CODE_INVALID_PARAMS, newWebAPIClient, WebAPIClient
} from './webapi';
import * as selectors from './selectors';
import * as assert from '../common/assert';
import { PanelContainerLayout } from './components/PanelContainer';
import {
    newVariableLayer, getCsvUrl, AUTO_LAYER_ID, isFigureResource, findResourceByName,
    getLockForGetWorkspaceVariableStatistics, hasWebGL, getLockForLoadDataSources, getFeatureUrl,
    isAnimationResource, getHtmlUrl, MY_PLACES_LAYER_ID, getNonSpatialIndexers, genSimpleId, PLACEMARK_ID_PREFIX,
    getWorldViewVectorLayerForEntity
} from './state-util';
import { SplitDir } from './components/Splitter';
import { updateObject } from '../common/objutil';
import { showToast } from './toast';
import * as redux from 'redux';
import * as d3 from 'd3-fetch';
import * as Cesium from 'cesium';
import { isDefined, isNumber } from '../common/types';
import { reloadEntityWithOriginalGeometry } from './containers/globe-view-layers';
import { DirectGeometryObject, Feature } from 'geojson';
import { SimpleStyle } from '../common/geojson-simple-style';
import { GeometryToolType } from './components/cesium/geometry-tool';
import { getEntityByEntityId } from './components/cesium/cesium-util';
import { isAssignableFrom, VAR_NAME_LIKE_TYPE, VAR_NAMES_LIKE_TYPE } from '../common/cate-types';
import {
    assignConstantValueInput, assignResourceNameInput, InputAssignments,
    isInputAssigned
} from './containers/editor/value-editor-assign';
import { ERROR_CODE_CANCELLED } from './webapi';
import { DELETE_WORKSPACE_DIALOG_ID, OPEN_WORKSPACE_DIALOG_ID } from './containers/ChooseWorkspaceDialog';
import { AuthAPI, UserInfo } from './webapi/apis/AuthAPI'

/**
 * The fundamental Action type as it is used here.
 * All actions must have a "type" and a "payload" property.
 * Basic structure (i.e. the "type" property) is prescribed by "redux" module.
 */
export interface Action extends redux.Action {
    type: string;
    payload?: any;
}

/**
 * Signature of the Action dispatcher as used here.
 * Basic call interface is prescribed by "redux" module.
 */
export type Dispatch = (action: Action | ThunkAction) => void;

/**
 * Signature of a function that returns the current application state object.
 * Call interface is prescribed by "redux" module.
 */
export type GetState = () => State;

/**
 * Signature of a "thunk" action function as used here.
 * A thunk is piece of code that is executed later.
 * Basic call interface is prescribed by "redux-thunk" module.
 */
export type ThunkAction = (dispatch?: Dispatch, getState?: GetState) => void;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Application-level actions

export const UPDATE_INITIAL_STATE = 'UPDATE_INITIAL_STATE';
export const SET_WEBAPI_MODE = 'SET_WEBAPI_MODE';
export const SET_WEBAPI_STATUS = 'SET_WEBAPI_STATUS';
export const SET_WEBAPI_CONFIG = 'SET_WEBAPI_CONFIG';
export const UPDATE_DIALOG_STATE = 'UPDATE_DIALOG_STATE';
export const UPDATE_TASK_STATE = 'UPDATE_TASK_STATE';
export const REMOVE_TASK_STATE = 'REMOVE_TASK_STATE';
export const UPDATE_CONTROL_STATE = 'UPDATE_CONTROL_STATE';
export const UPDATE_SESSION_STATE = 'UPDATE_SESSION_STATE';
export const INVOKE_CTX_OPERATION = 'INVOKE_CTX_OPERATION';
export const SET_USER_CREDENTIALS = 'SET_USER_CREDENTIALS';
export const SET_USER_TOKEN = 'SET_USER_TOKEN';
export const CLEAR_USER_TOKEN = 'CLEAR_USER_TOKEN';

export function login(): ThunkAction {
    return async (dispatch: Dispatch, getState: GetState) => {

        const authAPI = new AuthAPI();

        dispatch(setWebAPIStatus('login'));

        let token;
        try {
            token = await authAPI.getToken(getState().communication.username,
                                           getState().communication.password);
        } catch (error) {
            console.info('error: ', error);
            showToast({type: 'error', text: 'Wrong username or password.'});
            return;
        }

        dispatch(_setToken(token));

        const webAPIConfig = authAPI.getWebAPIConfig(getState().communication.username);

        const userInfo = await authAPI.getUserInfo(getState().communication.username,
                                                   getState().communication.token);
        if (userInfo === null || !userInfo.server) {
            dispatch(setWebAPIStatus('launching'));
            let webAPIConfig;
            try {
                await authAPI.startWebAPI(getState().communication.username,
                                          getState().communication.token);
            } catch (error) {
                console.info('error: ', error);
                showToast({type: 'error', text: 'Failed to launch remote Cate service.'});
                return;
            }
        }

        dispatch(setWebAPIConfig(webAPIConfig));
        dispatch(connectWebAPIClient());
    };
}

export function logoff(): ThunkAction {
    return async (dispatch: Dispatch, getState: GetState) => {
        const authAPI = new AuthAPI();
        dispatch(setWebAPIStatus('logoff'));
        try {
            await authAPI.stopWebAPI(getState().communication.username);
        } catch (error) {
            console.info('error: ', error);
            showToast({type: 'error', text: 'Failed to log off.'});
            return;
        }
        dispatch(_clearToken());
        dispatch(setWebAPIStatus(null));
    };
}

function _setToken(token: string): Action {
    return {type: SET_USER_TOKEN, payload: {token}}
}

function _clearToken(): Action {
    return {type: CLEAR_USER_TOKEN}
}

export function setWebAPIMode(webAPIMode: WebAPIMode): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        dispatch(_setWebAPIMode(webAPIMode));
        if (getState().data.appConfig.webAPIMode === 'local') {
            dispatch(connectWebAPIClient());
        }
    };
}

export function _setWebAPIMode(webAPIMode: WebAPIMode): Action {
    return {type: SET_WEBAPI_MODE, payload: {webAPIMode}}
}

export function setWebAPIStatus(webAPIStatus: WebAPIStatus,
                                webAPIClient: WebAPIClient | null = null): Action {
    return {type: SET_WEBAPI_STATUS, payload: {webAPIStatus, webAPIClient}};
}

export function setWebAPIConfig(webAPIConfig: WebAPIConfig): Action {
    return {type: SET_WEBAPI_CONFIG, payload: {webAPIConfig}};
}

export function connectWebAPIClient(): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        dispatch(setWebAPIStatus('connecting'));

        const webAPIConfig = getState().data.appConfig.webAPIConfig;
        console.log('webAPIConfig:', webAPIConfig);
        const webAPIClient = newWebAPIClient(selectors.apiWebSocketsUrlSelector(getState()));

        webAPIClient.onOpen = () => {
            dispatch(setWebAPIStatus('open', webAPIClient));
            dispatch(loadBackendConfig());
            dispatch(loadColorMaps());
            dispatch(loadDataStores());
            dispatch(loadOperations());
            dispatch(loadInitialWorkspace());
        };

        webAPIClient.onClose = () => {
            dispatch(setWebAPIStatus('closed'));
        };

        webAPIClient.onError = () => {
            dispatch(setWebAPIStatus('error'));
        };

        webAPIClient.onWarning = (event) => {
            console.warn(`cate-desktop: warning from cate-webapi: ${event.message}`);
        };
    };
}

export function updateInitialState(initialState: Object): Action {
    return {type: UPDATE_INITIAL_STATE, payload: initialState};
}

export function setUserCredentials(username: string, password: string) {
    return {type: SET_USER_CREDENTIALS, payload: {username, password}};
}

export function updateDialogState(dialogId: string, ...dialogState): Action {
    return {type: UPDATE_DIALOG_STATE, payload: {dialogId, dialogState: Object.assign({}, ...dialogState)}};
}

export function showDialog(dialogId: string, dialogState?: any): Action {
    return updateDialogState(dialogId, dialogState, {isOpen: true});
}

export function hideDialog(dialogId: string, dialogState?: any): Action {
    return updateDialogState(dialogId, dialogState, {isOpen: false});
}

export function updateTaskState(jobId: number, taskState: TaskState): Action {
    return {type: UPDATE_TASK_STATE, payload: {jobId, taskState}};
}

export function removeTaskState(jobId: number): Action {
    return {type: REMOVE_TASK_STATE, payload: {jobId}};
}

export function setControlProperty(propertyName: string, value: any): Action {
    return updateControlState({[propertyName]: value});
}

export function invokeCtxOperation(operation: OperationState, inputAssignments: InputAssignments): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {

        const resource = selectors.selectedResourceSelector(getState());
        if (resource) {
            for (let input of operation.inputs) {
                if (!isInputAssigned(inputAssignments, input.name)
                    && isAssignableFrom(input.dataType, resource.dataType)) {
                    inputAssignments = assignResourceNameInput(inputAssignments, input.name, resource.name);
                    break;
                }
            }
        }

        const variable = selectors.selectedVariableSelector(getState());
        if (variable) {
            for (let input of operation.inputs) {
                if (!isInputAssigned(inputAssignments, input.name)
                    && (input.dataType === VAR_NAME_LIKE_TYPE || input.dataType === VAR_NAMES_LIKE_TYPE)) {
                    inputAssignments = assignConstantValueInput(inputAssignments, input.name, variable.name);
                    break;
                }
            }
        }

        dispatch(invokeCtxOperationImpl(operation.name, inputAssignments));
    };
}

export function invokeCtxOperationImpl(selectedCtxOperationName: string, inputAssignments: InputAssignments): Action {
    return {type: INVOKE_CTX_OPERATION, payload: {selectedCtxOperationName, inputAssignments}};
}

export function updateControlState(controlState: any): Action {
    return {type: UPDATE_CONTROL_STATE, payload: controlState};
}

export function updatePreferences(session: any, sendToMain: boolean = false): ThunkAction {
    return (dispatch: Dispatch) => {
        session = {...session, hasWebGL: hasWebGL()};
        dispatch(updateSessionState(session));
        if (sendToMain) {
            dispatch(sendPreferencesToMain());
        }
    };
}

export function setSessionProperty(propertyName: string, value: any): Action {
    return updateSessionState({[propertyName]: value});
}

export function updateSessionState(sessionState: any): Action {
    return {type: UPDATE_SESSION_STATE, payload: sessionState};
}

export function loadBackendConfig(): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        function call() {
            // Get state from the Python back-end
            return selectors.backendConfigAPISelector(getState()).getBackendConfig();
        }

        function action(backendConfig: BackendConfigState) {
            dispatch(updateBackendConfig(backendConfig));
        }

        callAPI({title: 'Load configuration', dispatch, call, action});
    };
}

export function updateBackendConfig(backendConfig: BackendConfigState): Action {
    return updateSessionState({backendConfig});
}

export function storeBackendConfig(backendConfig: BackendConfigState): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        function call() {
            // Store state changes to the Python back-end
            return selectors.backendConfigAPISelector(getState()).setBackendConfig(backendConfig);
        }

        callAPI({title: 'Store configuration', dispatch, call});
    };
}

export function cancelJob(jobId: number): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const webAPIClient = selectors.webAPIClientSelector(getState());
        webAPIClient.cancel(jobId);
    }
}

function jobSubmitted(jobId: number, jobTitle: string, requestLock: string): Action {
    return updateTaskState(jobId, {status: JobStatusEnum.SUBMITTED, title: jobTitle, requestLock: requestLock});
}

function jobProgress(progress: JobProgress): Action {
    return updateTaskState(progress.id, {status: JobStatusEnum.IN_PROGRESS, progress});
}

function jobDone(jobId: number): Action {
    return updateTaskState(jobId, {status: JobStatusEnum.DONE});
}

function jobFailed(jobId: number,
                   jobTitle: string,
                   failure: JobFailure,
                   dispatch: (action: Action) => void,
                   notificationDisabled: boolean): void {
    const status = failure.code === ERROR_CODE_CANCELLED ? JobStatusEnum.CANCELLED : JobStatusEnum.FAILED;
    let type, text, action;
    if (status === JobStatusEnum.CANCELLED) {
        type = 'notification';
        text = `Cancelled: ${jobTitle}`;
    } else {
        type = 'error';
        text = failure.message || `Failed: ${jobTitle}`;
        action = {
            text: 'Details',
            onClick: () => {
                dispatch(showJobFailureDetails(jobTitle, failure));
            }
        };
    }
    dispatch(updateTaskState(jobId, {status, failure}));
    if (!notificationDisabled) {
        if (failure.code === ERROR_CODE_INVALID_PARAMS) {
            dispatch(showJobFailureDetails(jobTitle, failure));
        } else {
            showToast({type, text, action} as MessageState);
        }
    }
}

export function showJobFailureDetails(jobTitle: string, jobFailure: JobFailure): Action {
    return showDialog('jobFailureDialog', {jobTitle, jobFailure});
}

export type JobPromiseFactory<T> = (jobProgressHandler: JobProgressHandler) => JobPromise<T>;
export type JobPromiseAction<T> = (jobResult: T) => void;
export type JobPromisePlanB = (jobFailure: JobFailure) => void;

interface CallAPIOptions<T> {
    /** The actual API call. */
    call: JobPromiseFactory<T>;
    /** A human-readable title for the job that is being created. */
    title: string;
    /** Redux' dispatch() function. */
    dispatch: (action: Action) => void;
    /** The action to be performed when the API call succeeds. */
    action?: JobPromiseAction<T>;
    /** A lock to prevent multiple invocations. */
    requestLock?: string;
    /** The action to be performed when the API call fails. */
    planB?: JobPromisePlanB;
    /** If true, no notifications about job status will be delivered, except errors. */
    disableNotifications?: boolean;
    /** If true, a notification is shown when done even when no start notification was shown (due to startToastDelay). */
    requireDoneNotification?: boolean;
    /** Delay in milliseconds before a toast is shown. */
    startToastDelay?: number;
}

/**
 * Call some (remote) API asynchronously.
 *
 * @param options Options that control the API call.
 */
export function callAPI<T>(options: CallAPIOptions<T>): void {
    const {
        call,
        title,
        dispatch,
        action,
        requestLock,
        planB,
        disableNotifications = false,
        requireDoneNotification = false,
        startToastDelay = 500,
    } = options;

    const onProgress = (progress: JobProgress) => {
        if (!disableNotifications) {
            dispatch(jobProgress(progress));
        }
    };
    const jobPromise = call(onProgress);

    let startToastShown = false;
    let startToastTimeoutHandler;
    if (!disableNotifications) {
        startToastTimeoutHandler = setTimeout(() => {
            showToast({type: 'notification', text: 'Started: ' + title});
            startToastShown = true;
        }, startToastDelay);
        dispatch(jobSubmitted(jobPromise.getJobId(), title, requestLock));
    }

    const onDone = (jobResult: T) => {
        if (!disableNotifications) {
            clearTimeout(startToastTimeoutHandler);
            if (startToastShown || requireDoneNotification) {
                showToast({type: 'success', text: 'Done: ' + title});
            }
            dispatch(jobDone(jobPromise.getJobId()));
        }
        if (action) {
            action(jobResult);
        }
    };
    const onFailure = jobFailure => {
        if (!disableNotifications) {
            if (!startToastShown) {
                clearTimeout(startToastTimeoutHandler);
            }
        }
        // Always show errors in TASKS panel
        jobFailed(jobPromise.getJobId(), title, jobFailure, dispatch, disableNotifications);
        if (planB) {
            planB(jobFailure);
        }
    };

    jobPromise.then(onDone, onFailure);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Globe State

export const SET_GLOBE_MOUSE_POSITION = 'SET_GLOBE_MOUSE_POSITION';
export const SET_GLOBE_VIEW_POSITION = 'SET_GLOBE_VIEW_POSITION';

export function setGlobeMousePosition(position: GeographicPosition): Action {
    return {type: SET_GLOBE_MOUSE_POSITION, payload: {position}};
}


function setGlobeViewPositionImpl(position: GeographicPosition | null,
                                  positionData: { [varName: string]: number } | null): Action {
    return {type: SET_GLOBE_VIEW_POSITION, payload: {position, positionData}};
}

export function setGlobeViewPosition(position: GeographicPosition): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        if (position) {
            // TODO: using selectedRightBottomPanelID is no good indicator for checking VARIABLES panel visibility.
            const selectedRightBottomPanelID = selectors.selectedRightBottomPanelIdSelector(getState());
            if (selectedRightBottomPanelID === 'variables') {
                const baseDir = selectors.workspaceBaseDirSelector(getState());
                if (!baseDir) {
                    // Workspace not yet ready, that's ok.
                    return;
                }
                const resource = selectors.selectedResourceSelector(getState());
                const layer = selectors.selectedVariableImageLayerSelector(getState());
                if (layer && resource) {
                    const indexers = getNonSpatialIndexers(resource, layer);

                    function call() {
                        return selectors.datasetAPISelector(getState()).extractPixelValues(baseDir,
                                                                                           resource.name,
                                                                                           [position.longitude, position.latitude],
                                                                                           indexers);
                    }

                    function action(positionData: { [varName: string]: number }) {
                        dispatch(setGlobeViewPositionImpl(position, positionData));
                    }

                    callAPI({title: 'Load cell values', dispatch, call, action, disableNotifications: true});
                    return;
                }
            }
        } else {
            dispatch(setGlobeViewPositionImpl(null, null));
        }
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// (User) Placemark actions

export const ACTIVATE_NEW_PLACEMARK_TOOL = 'ACTIVATE_NEW_PLACEMARK_TOOL';
export const ADD_PLACEMARK = 'ADD_PLACEMARK';
export const REMOVE_PLACEMARK = 'REMOVE_PLACEMARK';
export const UPDATE_PLACEMARK_GEOMETRY = 'UPDATE_PLACEMARK_GEOMETRY';
export const UPDATE_PLACEMARK_PROPERTIES = 'UPDATE_PLACEMARK_PROPERTIES';
export const UPDATE_PLACEMARK_STYLE = 'UPDATE_PLACEMARK_STYLE';

export function activateNewPlacemarkTool(newPlacemarkToolType: GeometryToolType) {
    return {type: ACTIVATE_NEW_PLACEMARK_TOOL, payload: {newPlacemarkToolType}};
}

export function addPlacemark(placemark: Placemark): Action {
    return {type: ADD_PLACEMARK, payload: {placemark}};
}

export function addPointPlacemark(longitude: number, latitude: number, properties: any): Action {
    const placemark = {
        id: genSimpleId(PLACEMARK_ID_PREFIX),
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
        },
        properties,
    };
    return addPlacemark(placemark as any);
}

export function removePlacemark(placemarkId: string): Action {
    return {type: REMOVE_PLACEMARK, payload: {placemarkId}};
}

export function updatePlacemarkGeometry(placemarkId: string, geometry: DirectGeometryObject | any): Action {
    return {type: UPDATE_PLACEMARK_GEOMETRY, payload: {placemarkId, geometry}};
}

export function updatePlacemarkProperties(placemarkId: string, properties: any): Action {
    return {type: UPDATE_PLACEMARK_PROPERTIES, payload: {placemarkId, properties}};
}

export function updatePlacemarkStyle(placemarkId: string, style: SimpleStyle): Action {
    return {type: UPDATE_PLACEMARK_STYLE, payload: {placemarkId, style}};
}

export function locatePlacemark(placemarkId: string): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        let viewer = selectors.selectedWorldViewViewerSelector(getState());
        if (viewer) {
            let selectedEntity = getEntityByEntityId(viewer, placemarkId);
            if (selectedEntity) {
                let headingPitchRange;
                if (selectedEntity.position) {
                    let heading = 0, pitch = -3.14159 / 2, range = 2500000;
                    headingPitchRange = new Cesium.HeadingPitchRange(heading, pitch, range);
                }
                viewer.zoomTo(selectedEntity, headingPitchRange);
            }
        }
    };
}

export function setSelectedPlacemarkId(selectedPlacemarkId: string | null): Action {
    return updateSessionState({selectedPlacemarkId});
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
export function loadDataStores(): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        function call() {
            return selectors.datasetAPISelector(getState()).getDataStores();
        }

        function action(dataStores: DataStoreState[]) {
            const offlineMode = selectors.offlineModeSelector(getState());
            if (offlineMode) {
                dataStores = dataStores.filter(ds => ds.isLocal);
            }
            dispatch(updateDataStores(dataStores));

            if (dataStores && dataStores.length) {
                let selectedDataStoreId = selectors.selectedDataStoreIdSelector(getState());
                const selectedDataStore = dataStores.find(dataStore => dataStore.id === selectedDataStoreId);
                selectedDataStoreId = selectedDataStore ? selectedDataStore.id : dataStores[0].id;
                dispatch(setSelectedDataStoreId(selectedDataStoreId));
            }
        }

        callAPI({title: 'Loading data stores', dispatch, call, action});
    }
}


export function updateDataStores(dataStores: Array<DataStoreState>): Action {
    return {type: UPDATE_DATA_STORES, payload: {dataStores}};
}

/**
 * Asynchronously load data sources for given data store ID.
 *
 * @param dataStoreId
 * @param setSelection
 * @returns a Redux thunk action
 */
export function loadDataSources(dataStoreId: string, setSelection: boolean): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const requestLock = getLockForLoadDataSources(dataStoreId);
        if (selectors.activeRequestLocksSelector(getState()).has(requestLock)) {
            return;
        }

        function call(onProgress) {
            return selectors.datasetAPISelector(getState()).getDataSources(dataStoreId, onProgress);
        }

        function action(dataSources: DataSourceState[]) {
            dispatch(updateDataSources(dataStoreId, dataSources));
            if (setSelection) {
                let selectedDataSourceId = selectors.selectedDataSourceIdSelector(getState());
                if (dataSources && dataSources.length) {
                    const selectedDataSource = dataSources.find(dataSource => dataSource.id === selectedDataSourceId);
                    selectedDataSourceId = selectedDataSource ? selectedDataSource.id : selectedDataSourceId;
                }
                dispatch(setSelectedDataSourceId(selectedDataSourceId));
            }
        }

        const dataStore = getState().data.dataStores.find(dataStore => dataStore.id === dataStoreId);
        callAPI({
                    title: `Load data sources for store "${dataStore ? dataStore.id : '?'}"`,
                    dispatch,
                    call,
                    action,
                    requestLock
                });
    }
}

export function updateDataSources(dataStoreId: string, dataSources): Action {
    return {type: UPDATE_DATA_SOURCES, payload: {dataStoreId, dataSources}};
}

export function setSelectedDataStoreId(selectedDataStoreId: string | null): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        if (getState().session.selectedDataStoreId === selectedDataStoreId) {
            //return;
        }
        dispatch(setSelectedDataStoreIdImpl(selectedDataStoreId));
        if (selectedDataStoreId !== null) {
            const dataStore = getState().data.dataStores.find(dataStore => dataStore.id === selectedDataStoreId);
            if (!dataStore.dataSources) {
                dispatch(loadDataSources(selectedDataStoreId, true));
            }
        }
    }
}

export function setSelectedDataStoreIdImpl(selectedDataStoreId: string | null) {
    return updateSessionState({selectedDataStoreId});
}

export function setSelectedDataSourceId(selectedDataSourceId: string | null) {
    return updateSessionState({selectedDataSourceId});
}

export function setDataSourceFilterExpr(dataSourceFilterExpr: string) {
    return updateSessionState({dataSourceFilterExpr});
}

export function loadTemporalCoverage(dataStoreId: string, dataSourceId: string): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {

        function call(onProgress) {
            return selectors.datasetAPISelector(getState()).getDataSourceTemporalCoverage(dataStoreId, dataSourceId, onProgress);
        }

        function action(temporalCoverage) {
            dispatch(updateDataSourceTemporalCoverage(dataStoreId, dataSourceId, temporalCoverage));
        }

        callAPI({title: `Load temporal coverage for ${dataSourceId}`, dispatch, call, action});
    };
}

export function updateDataSourceTemporalCoverage(dataStoreId: string,
                                                 dataSourceId: string,
                                                 temporalCoverage: [string, string] | null): Action {
    return {type: UPDATE_DATA_SOURCE_TEMPORAL_COVERAGE, payload: {dataStoreId, dataSourceId, temporalCoverage}};
}

export function openDataset(dataSourceId: string, args: any, updateLocalDataSources: boolean): ThunkAction {
    return (dispatch: Dispatch) => {

        const opName = 'open_dataset';
        const opArgs = {
            ds_id: dataSourceId,
            ...args
        };

        // Wrap the opArgs into a new OpArgs object where each value is indicated by a "value" key.
        // The reason is that an opArg could also refer to a resource, the "source" key would be used instead.
        //
        const wrappedOpArgs = {};
        Object.keys(opArgs).forEach(name => {
            wrappedOpArgs[name] = {value: opArgs[name]};
        });
        let postSetAction;
        if (updateLocalDataSources) {
            postSetAction = (dispatch: Dispatch) => {
                dispatch(loadDataSources('local', false));
            }
        }

        dispatch(setWorkspaceResource(opName,
                                      wrappedOpArgs,
                                      null,
                                      false,
                                      `Opening data source "${dataSourceId}"`, postSetAction));
    }
}

export function addLocalDataset(dataSourceId: string, filePathPattern: string): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        function call(onProgress) {
            return selectors.datasetAPISelector(getState()).addLocalDataSource(dataSourceId, filePathPattern, onProgress);
        }

        function action(dataSources: DataSourceState[]) {
            dispatch(updateDataSources('local', dataSources));
        }

        callAPI({
                    title: `Add local data source "${dataSourceId}"`,
                    dispatch, call, action, requireDoneNotification: true
                });
    }
}

export function removeLocalDataset(dataSourceId: string, removeFiles: boolean): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        function call(onProgress) {
            return selectors.datasetAPISelector(getState()).removeLocalDataSource(dataSourceId, removeFiles, onProgress);
        }

        function action(dataSources: DataSourceState[]) {
            dispatch(updateDataSources('local', dataSources));
        }

        callAPI({
                    title: `Remove local copy of data source "${dataSourceId}"`,
                    dispatch, call, action, requireDoneNotification: true
                });
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Operation actions

export const UPDATE_OPERATIONS = 'UPDATE_OPERATIONS';

export function loadOperations(): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {

        function call() {
            return selectors.operationAPISelector(getState()).getOperations();
        }

        function action(operations: OperationState[]) {
            dispatch(updateOperations(operations));
        }

        callAPI({title: 'Load operations', dispatch, call, action});
    };
}

export function updateOperations(operations): Action {
    return {type: UPDATE_OPERATIONS, payload: {operations}};
}

export function setSelectedOperationName(selectedOperationName: string | null) {
    return updateSessionState({selectedOperationName});
}

export function setOperationFilterTags(operationFilterTags: string[]) {
    return updateSessionState({operationFilterTags});
}

export function setOperationFilterExpr(operationFilterExpr: string) {
    return updateSessionState({operationFilterExpr});
}

export function showOperationStepDialog(dialogId: string) {
    return showDialog(dialogId);
}

export function hideOperationStepDialog(dialogId: string, inputAssignments?): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        if (inputAssignments) {
            const dialogState = getState().control.dialogs[dialogId] as any;
            inputAssignments = {...dialogState.inputAssignments, ...inputAssignments};
        }
        dispatch(hideDialog(dialogId, {inputAssignments}));
    };
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Workspace actions

export const SET_CURRENT_WORKSPACE = 'SET_CURRENT_WORKSPACE';
export const UPDATE_WORKSPACE_NAMES = 'UPDATE_WORKSPACE_NAMES';
export const RENAME_RESOURCE = 'RENAME_RESOURCE';
export const SHOW_FIGURE_VIEW = 'SHOW_FIGURE_VIEW';
export const SHOW_ANIMATION_VIEW = 'SHOW_ANIMATION_VIEW';
export const SHOW_TABLE_VIEW = 'SHOW_TABLE_VIEW';

export function updateWorkspaceNames(workspaceNames: string[]): Action {
    return {type: UPDATE_WORKSPACE_NAMES, payload: {workspaceNames}};
}

/**
 * Asynchronously load the initial workspace.
 * Called only a single time on app initialisation.
 *
 * @returns a Redux thunk action
 */
export function loadInitialWorkspace(): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
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
export function newWorkspace(workspacePath: string | null): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        function call() {
            return selectors.workspaceAPISelector(getState()).newWorkspace(workspacePath);
        }

        function action(workspace: WorkspaceState) {
            dispatch(setCurrentWorkspace(workspace));
            dispatch(saveWorkspace());
            if (workspace && workspace.workflow.steps.length > 0) {
                dispatch(setSelectedWorkspaceResourceName(workspace.workflow.steps[0].id));
            } else {
                dispatch(setSelectedWorkspaceResourceName(null));
            }
        }

        function planB(jobFailure: JobFailure) {
            showMessageBox({
                               type: 'error',
                               title: 'New Workspace',
                               message: 'Failed to create new workspace.',
                               detail: jobFailure.message
                           });
        }

        callAPI({
                    title: 'New workspace' + (workspacePath ? ` "${workspacePath}"` : ''),
                    dispatch, call, action, planB, requireDoneNotification: true
                });
    }
}

/**
 * Asynchronously open the a workspace.
 *
 * @param workspacePath workspace path
 * @returns a Redux thunk action
 */
export function openWorkspace(workspacePath?: string | null): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        function call(onProgress) {
            return selectors.workspaceAPISelector(getState()).openWorkspace(workspacePath, onProgress);
        }

        function action(workspace: WorkspaceState) {
            dispatch(setCurrentWorkspace(workspace));
            if (workspace && workspace.workflow.steps.length > 0) {
                dispatch(setSelectedWorkspaceResourceName(workspace.workflow.steps[0].id));
            } else {
                dispatch(setSelectedWorkspaceResourceName(null));
            }
        }

        function planB() {
            let workspace = getState().data.workspace;
            if (!workspace) {
                dispatch(newWorkspace(null));
            }
        }

        callAPI({
                    title: `Open workspace "${workspacePath}"`,
                    dispatch, call, action, planB, requireDoneNotification: true
                });
    }
}

/**
 * Asynchronously close the current workspace.
 *
 * @returns a Redux thunk action
 */
export function closeWorkspace(): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const baseDir = selectors.workspaceBaseDirSelector(getState());
        assert.ok(baseDir);

        function call() {
            return selectors.workspaceAPISelector(getState()).closeWorkspace(baseDir);
        }

        function action() {
            dispatch(newWorkspace(null));
        }

        callAPI({
                    title: 'Close workspace',
                    dispatch, call, action, requireDoneNotification: true
                });
    }
}

/**
 * Asynchronously close the current workspace.
 *
 * @returns a Redux thunk action
 */
export function saveWorkspace(): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        let workspace = getState().data.workspace;
        assert.ok(workspace);

        if (workspace.isScratch) {
            return saveWorkspaceAs;
        }

        const baseDir = workspace.baseDir;

        function call(onProgress) {
            return selectors.workspaceAPISelector(getState()).saveWorkspace(baseDir, onProgress);
        }

        function action(workspace: WorkspaceState) {
            dispatch(setCurrentWorkspace(workspace));
        }

        function planB(jobFailure: JobFailure) {
            showMessageBox({
                               type: 'error',
                               title: 'Save Workspace',
                               message: 'Failed to save workspace.',
                               detail: jobFailure.message
                           });
        }

        callAPI({
                    title: 'Save workspace',
                    dispatch, call, action, planB, requireDoneNotification: true
                });
    }
}

/**
 * Asynchronously save the current workspace using a new name.
 *
 * @returns a Redux thunk action
 */
export function saveWorkspaceAs(workspacePath: string): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const baseDir = selectors.workspaceBaseDirSelector(getState());
        assert.ok(baseDir);

        function call(onProgress) {
            return selectors.workspaceAPISelector(getState()).saveWorkspaceAs(baseDir, workspacePath, onProgress);
        }

        function action(workspace: WorkspaceState) {
            dispatch(setCurrentWorkspace(workspace));
        }

        function planB(jobFailure: JobFailure) {
            showMessageBox({
                               type: 'error',
                               title: 'Save Workspace As',
                               message: 'Failed to save workspace.',
                               detail: jobFailure.message
                           });
        }

        callAPI({
                    title: `Save workspace as "${workspacePath}"`,
                    dispatch, call, action, planB, requireDoneNotification: true
                });
    }
}

/**
 * Asynchronously clean the current workspace.
 *
 * @returns a Redux thunk action
 */
export function cleanWorkspace(): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        let workspace = getState().data.workspace;
        assert.ok(workspace);
        const baseDir = workspace.baseDir;

        function call() {
            return selectors.workspaceAPISelector(getState()).cleanWorkspace(baseDir);
        }

        function action(workspace: WorkspaceState) {
            dispatch(setCurrentWorkspace(workspace));
        }

        callAPI({
                    title: `Clean workspace "${baseDir}"`,
                    dispatch, call, action, requireDoneNotification: true
                });
    }
}


/**
 * Asynchronously delete the given resource.
 *
 * @returns a Redux thunk action
 */
export function deleteResource(resName: string): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        let workspace = getState().data.workspace;
        assert.ok(workspace);
        const baseDir = workspace.baseDir;

        function call() {
            return selectors.workspaceAPISelector(getState()).deleteWorkspaceResource(baseDir, resName);
        }

        function action(workspace: WorkspaceState) {
            dispatch(setCurrentWorkspace(workspace));
        }

        callAPI({
                    title: `Delete step/resource "${resName}"`, dispatch, call, action,
                    requireDoneNotification: true
                });
    }
}

/**
 * Asynchronously delete the workspace with the given name.
 *
 * @returns a Redux thunk action
 */
export function deleteWorkspace(workspaceName: string, deleteEntireWorkspace = true): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {

        function call() {
            return selectors.workspaceAPISelector(getState()).deleteWorkspace(workspaceName, deleteEntireWorkspace);
        }

        callAPI({
                    title: `Delete step/workspace "${workspaceName}"`, dispatch, call,
                    requireDoneNotification: true
                });
    }
}


/**
 * Bring up the "New Workspace" dialog.
 *
 * @returns a Redux action
 */
export function newWorkspaceInteractive() {
    return showDialog('newWorkspaceDialog');
}

function openRemoteWorkspace(dispatch: (action: (Action | ThunkAction)) => void,
                             getState: () => State) {
    let jobPromise = selectors.workspaceAPISelector(getState()).listWorkspaces();
    jobPromise.then(workspaceNames => {
        dispatch(updateWorkspaceNames(workspaceNames));
        dispatch(showDialog(OPEN_WORKSPACE_DIALOG_ID));
    })
}

function deleteRemoteWorkspace(dispatch: (action: (Action | ThunkAction)) => void,
                               getState: () => State) {
    let state = getState();
    let jobPromise = selectors.workspaceAPISelector(getState()).listWorkspaces();
    jobPromise.then(workspaceNames => {
        dispatch(updateWorkspaceNames(workspaceNames));
        dispatch(showDialog(DELETE_WORKSPACE_DIALOG_ID));
    })
}

function openLocalWorkspace(dispatch: (action: (Action | ThunkAction)) => void,
                            getState: () => State) {
    const workspacePath = showSingleFileOpenDialog({
                                                       title: 'Open Workspace - Select Directory',
                                                       buttonLabel: 'Open',
                                                       properties: ['openDirectory'],
                                                   });
    if (workspacePath) {
        const workspace = getState().data.workspace;
        let ok = true;
        if (workspace) {
            if (workspace.baseDir === workspacePath) {
                // showMessageBox({
                //     title: 'Open Workspace',
                //     message: 'Workspace is already open.'
                // }, MESSAGE_BOX_NO_REPLY);
                showToast({
                              type: 'warning',
                              text: 'Workspace is already open.',
                          });
                return;
            }
            ok = maybeSaveCurrentWorkspace(dispatch, getState,
                                           'Open Workspace',
                                           'Would you like to save the current workspace before opening the new one?',
                                           'Press "Cancel" to cancel opening a new workspace.'
            );
        }
        if (ok) {
            dispatch(openWorkspace(workspacePath));
        }
    }
}

/**
 * Let user select a workspace, then ask whether to save the existing workspace, then open new one.
 *
 * @returns a Redux thunk action
 */
export function openWorkspaceInteractive(): ThunkAction {

    return (dispatch: Dispatch, getState: GetState) => {
        if (selectors.isLocalWebAPISelector(getState())) {
            openLocalWorkspace(dispatch, getState);
        } else {
            openRemoteWorkspace(dispatch, getState);
        }
    };
}

/**
 * Let user select a workspace, then ask whether to delete the selected workspace.
 *
 * @returns a Redux thunk action
 */
export function deleteWorkspaceInteractive(): ThunkAction {

    return (dispatch: Dispatch, getState: GetState) => {
        if (!selectors.isLocalWebAPISelector(getState())) {
            deleteRemoteWorkspace(dispatch, getState);
        }
    };
}

/**
 * Ask user to whether to save workspace, then close it.
 *
 * @returns a Redux thunk action
 */
export function closeWorkspaceInteractive(): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const ok = maybeSaveCurrentWorkspace(dispatch, getState,
                                             'Close Workspace',
                                             'Would you like to save the current workspace before closing it?',
                                             'Press "Cancel" to cancel closing the workspace.'
        );
        if (ok) {
            dispatch(closeWorkspace())
        }
    };
}

/**
 * Ask user whether to clean workspace, then clean it.
 *
 * @returns a Redux thunk action
 */
export function cleanWorkspaceInteractive(): ThunkAction {
    return (dispatch: Dispatch) => {
        const answer = showMessageBox({
                                          type: 'question',
                                          title: 'Clean Workspace',
                                          message: 'Do you really want to clean this workspace?',
                                          detail: 'This will delete all resources and workflow steps.\nYou will not be able to undo this operation.',
                                          buttons: ['Yes', 'No'],
                                          defaultId: 1,
                                          cancelId: 1,
                                      });
        if (answer && answer.buttonIndex === 0) {
            dispatch(cleanWorkspace());
        }
    };
}

/**
 * Ask user whether to delete a resoure/step, then delete it.
 *
 * @returns a Redux thunk action
 */
export function deleteResourceInteractive(resName: string): ThunkAction {
    return (dispatch: Dispatch) => {
        const answer = showMessageBox({
                                          type: 'question',
                                          title: 'Remove Resource and Workflow Step',
                                          message: `Do you really want to delete resource and step "${resName}"?`,
                                          detail: 'This will also delete the workflow step that created it.\n' +
                                                  'You will not be able to undo this operation.',
                                          buttons: ['Yes', 'No'],
                                          defaultId: 1,
                                          cancelId: 1,
                                      });
        if (answer && answer.buttonIndex === 0) {
            dispatch(deleteResource(resName));
        }
    };
}

/**
 * If current workspace is scratch workspace, delegate to "save as" action" otherwise save it.
 *
 * @returns a Redux thunk action
 */
export function saveWorkspaceInteractive(): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const workspace = getState().data.workspace;
        if (workspace.isScratch) {
            dispatch(saveWorkspaceAsInteractive());
        } else {
            dispatch(saveWorkspace())
        }
    };
}

/**
 * Bring up the "Save Workspace As" dialog.
 *
 * @returns a Redux action
 */
export function saveWorkspaceAsInteractive() {
    return showDialog('saveWorkspaceAsDialog');
}

/**
 * Save workspace after asking user whether to do so.
 *
 * @returns false, if action was cancelled, otherwise true
 */
function maybeSaveCurrentWorkspace(dispatch, getState: GetState, title: string, message: string, detail?: string): boolean {
    const workspace = getState().data.workspace;
    if (workspace) {
        const maySave = workspace.workflow.steps.length && (workspace.isModified || !workspace.isSaved);
        if (maySave) {
            const answer = showMessageBox({
                                              type: 'question',
                                              title,
                                              message,
                                              detail,
                                              buttons: ['Yes', 'No', 'Cancel'],
                                              defaultId: 0,
                                              cancelId: 2,
                                          });
            if (answer) {
                if (answer.buttonIndex === 0) {
                    if (workspace.isScratch) {
                        dispatch(saveWorkspaceAsInteractive());
                    } else {
                        dispatch(saveWorkspace());
                    }
                } else if (answer.buttonIndex === 2) {
                    return false;
                }
            } else {
                return false;
            }
        }
    }
    return true;
}

export function setCurrentWorkspace(workspace: WorkspaceState): ThunkAction {
    return (dispatch: Dispatch) => {
        dispatch(setCurrentWorkspaceImpl(workspace));
        if (!workspace.isScratch) {
            dispatch(updatePreferences({lastWorkspacePath: workspace.baseDir} as any, true));
        }
    }
}

function setCurrentWorkspaceImpl(workspace: WorkspaceState): Action {
    return {type: SET_CURRENT_WORKSPACE, payload: {workspace}};
}

export function setSelectedWorkspaceResourceName(selectedWorkspaceResourceName: string): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        dispatch(setSelectedWorkspaceResourceNameImpl(selectedWorkspaceResourceName));
        if (selectedWorkspaceResourceName && getState().data.workspace) {
            const resources: Array<ResourceState> = getState().data.workspace.resources;
            if (resources) {
                const resource = resources.find(res => res.name === selectedWorkspaceResourceName);
                if (resource && resource.variables && resource.variables.length) {
                    const variable = resource.variables.find(variable => !!variable.isDefault);
                    dispatch(setSelectedVariable(resource,
                        variable || resource.variables[0],
                                                 selectors.savedLayersSelector(getState())));
                }
            }
        }
    }
}

function setSelectedWorkspaceResourceNameImpl(selectedWorkspaceResourceName: string): Action {
    return updateControlState({selectedWorkspaceResourceName});
}

export function setSelectedWorkflowStepId(selectedWorkflowStepId: string): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        if (selectedWorkflowStepId) {
            const resourceMap = selectors.resourceMapSelector(getState());
            const resource = resourceMap[selectedWorkflowStepId];
            if (resource) {
                dispatch(setSelectedWorkspaceResourceName(resource.name));
            }
        }
        dispatch(setSelectedWorkflowStepIdImpl(selectedWorkflowStepId));
    };
}

function setSelectedWorkflowStepIdImpl(selectedWorkflowStepId: string): Action {
    return updateControlState({selectedWorkflowStepId});
}

export function setWorkspaceResource(opName: string,
                                     opArgs: OperationKWArgs,
                                     resName: string | null,
                                     overwrite: boolean,
                                     title: string,
                                     postSetAction?): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const baseDir = selectors.workspaceBaseDirSelector(getState());
        assert.ok(baseDir);

        function call(onProgress) {
            return selectors.workspaceAPISelector(getState()).setWorkspaceResource(baseDir,
                                                                                   opName,
                                                                                   opArgs,
                                                                                   resName,
                                                                                   overwrite,
                                                                                   onProgress);
        }

        function action(result: [WorkspaceState, string]) {
            const workspace = result[0];
            const resName = result[1];
            dispatch(setCurrentWorkspace(workspace));

            const resource = findResourceByName(selectors.resourcesSelector(getState()), resName);
            const isFigure = isFigureResource(resource);
            const isAnimation = isAnimationResource(resource);
            if (!isFigure && !isAnimation) {
                dispatch(setSelectedWorkspaceResourceName(resName));
            }
            if ((isFigure || isAnimation) && getState().session.autoShowNewFigures) {
                if (isFigure) {
                    dispatch(showFigureView(resource, selectors.activeViewIdSelector(getState())))
                } else if (isAnimation) {
                    dispatch(showAnimationView(resource, selectors.activeViewIdSelector(getState())))
                }
            }
            if (postSetAction) {
                dispatch(postSetAction);
            }
        }

        callAPI({dispatch, title, call, action, requireDoneNotification: true});
    }
}

export function setWorkspaceResourcePersistence(resName: string, persistent: boolean): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const baseDir = selectors.workspaceBaseDirSelector(getState());
        assert.ok(baseDir);

        function call() {
            return selectors.workspaceAPISelector(getState()).setWorkspaceResourcePersistence(baseDir, resName, persistent);
        }

        function action(workspace: WorkspaceState) {
            dispatch(setCurrentWorkspace(workspace));
        }

        callAPI({title: 'Change resource persistence', dispatch, call, action});
    }
}

export function renameWorkspaceResource(resName: string, newResName: string): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const baseDir = selectors.workspaceBaseDirSelector(getState());
        assert.ok(baseDir);

        function call() {
            return selectors.workspaceAPISelector(getState()).renameWorkspaceResource(baseDir, resName, newResName);
        }

        function action(workspace: WorkspaceState) {
            dispatch(setCurrentWorkspace(workspace));
            dispatch(renameWorkspaceResourceImpl(resName, newResName));
        }

        callAPI({title: 'Rename resource', dispatch, call, action});
    };
}

export function renameWorkspaceResourceImpl(resName: string, newResName: string): Action {
    return {type: RENAME_RESOURCE, payload: {resName, newResName}};
}

export function getWorkspaceVariableStatistics(resName: string,
                                               varName: string,
                                               varIndex: number[],
                                               action: (statistics: ImageStatisticsState) => any): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const baseDir = selectors.workspaceBaseDirSelector(getState());
        assert.ok(baseDir);

        function call(onProgress) {
            return selectors.workspaceAPISelector(getState()).getWorkspaceVariableStatistics(baseDir,
                                                                                             resName,
                                                                                             varName,
                                                                                             varIndex,
                                                                                             onProgress);
        }

        function action2(statistics: ImageStatisticsState) {
            dispatch(action(statistics));
        }

        const title = `Computing statistics for variable "${varName}"`;
        const requestLock = getLockForGetWorkspaceVariableStatistics(resName, varName, varIndex);
        callAPI({title, dispatch, call, action: action2, requestLock});
    }
}

export function showTableView(resName: string, varName: string | null, placeAfterViewId: string | null): Action {
    return {type: SHOW_TABLE_VIEW, payload: {resName, varName, placeAfterViewId}};
}

export function showFigureView(resource: ResourceState, placeAfterViewId: string | null): Action {
    return {type: SHOW_FIGURE_VIEW, payload: {resource, placeAfterViewId}};
}

export function showAnimationView(resource: ResourceState, placeAfterViewId: string | null): Action {
    return {type: SHOW_ANIMATION_VIEW, payload: {resource, placeAfterViewId}};
}

// noinspection JSUnusedLocalSymbols
export function saveFigureImageAs(imageUrl: string, figureId: number): ThunkAction {
    return () => {
        // console.log("saveFigureImageAs: ", imageUrl, figureId);
        const electron = require('electron');
        electron.shell.openExternal(imageUrl + '/png');

        // showFileSaveDialog({
        //     title: "Save Figure As",
        //     filters: [
        //         {name: 'Images', extensions: ["png", "jpeg", "tif"]},
        //         {name: 'Other', extensions: ["eps", "pdf", "ps", "raw", "svg"]},
        //     ]
        // }, (filePath: string) => {
        //     console.log("saveFigureImageAs:", filePath);
        // });
    };
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Variable actions

export const SET_SHOW_SELECTED_VARIABLE_LAYER = 'SET_SHOW_SELECTED_VARIABLE_LAYER';
export const SET_SELECTED_VARIABLE = 'SET_SELECTED_VARIABLE';

export function setShowSelectedVariableLayer(showSelectedVariableLayer: boolean): Action {
    return {type: SET_SHOW_SELECTED_VARIABLE_LAYER, payload: {showSelectedVariableLayer}};
}

export function setSelectedVariable(resource: ResourceState,
                                    selectedVariable: VariableState | null,
                                    savedLayers?: SavedLayers): Action {
    return {type: SET_SELECTED_VARIABLE, payload: {resource, selectedVariable, savedLayers}};
}

export function addVariableLayer(viewId: string,
                                 resource: ResourceState,
                                 variable: VariableState,
                                 selectLayer: boolean,
                                 savedLayers?: { [name: string]: LayerState }) {
    let layer = newVariableLayer(resource, variable, savedLayers);
    return addLayer(viewId, layer, selectLayer);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ApplicationPage actions

export function setLeftPanelContainerLayout(leftPanelContainerLayout: PanelContainerLayout) {
    return updateSessionState({leftPanelContainerLayout});
}

export function setRightPanelContainerLayout(rightPanelContainerLayout: PanelContainerLayout) {
    return updateSessionState({rightPanelContainerLayout});
}

export function setSelectedLeftTopPanelId(selectedLeftTopPanelId: string | null) {
    return updateSessionState({selectedLeftTopPanelId});
}

export function setSelectedLeftBottomPanelId(selectedLeftBottomPanelId: string | null) {
    return updateSessionState({selectedLeftBottomPanelId});
}

export function setSelectedRightTopPanelId(selectedRightTopPanelId: string | null) {
    return updateSessionState({selectedRightTopPanelId});
}

export function setSelectedRightBottomPanelId(selectedRightBottomPanelId: string | null) {
    return updateSessionState({selectedRightBottomPanelId});
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ViewManager actions

export const ADD_WORLD_VIEW = 'ADD_WORLD_VIEW';
export const ADD_TABLE_VIEW = 'ADD_TABLE_VIEW';
export const SELECT_VIEW = 'SELECT_VIEW';
export const CLOSE_VIEW = 'CLOSE_VIEW';
export const CLOSE_ALL_VIEWS = 'CLOSE_ALL_VIEWS';
export const SPLIT_VIEW_PANEL = 'SPLIT_VIEW_PANEL';
export const CHANGE_VIEW_SPLIT_POS = 'CHANGE_VIEW_SPLIT_POS';
export const MOVE_VIEW = 'MOVE_VIEW';


export function addWorldView(placeAfterViewId: string | null): Action {
    return {type: ADD_WORLD_VIEW, payload: {placeAfterViewId}};
}

export function selectView(viewPath: ViewPath, viewId: string): Action {
    return {type: SELECT_VIEW, payload: {viewPath, viewId}};
}

export function closeView(viewPath: ViewPath, viewId: string): Action {
    return {type: CLOSE_VIEW, payload: {viewPath, viewId}};
}

export function closeAllViews(viewPath: ViewPath): Action {
    return {type: CLOSE_ALL_VIEWS, payload: {viewPath}};
}

export function splitViewPanel(viewPath: ViewPath, dir: SplitDir, pos: number): Action {
    return {type: SPLIT_VIEW_PANEL, payload: {viewPath, dir, pos}};
}

export function changeViewSplitPos(viewPath: ViewPath, delta: number): Action {
    return {type: CHANGE_VIEW_SPLIT_POS, payload: {viewPath, delta}};
}

export function moveView(sourceViewId: string, placement: 'before' | 'after', targetViewId: string): Action {
    return {type: MOVE_VIEW, payload: {sourceViewId, placement, targetViewId}};
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// World view actions

export const SET_VIEW_MODE = 'SET_VIEW_MODE';
export const SET_PROJECTION_CODE = 'SET_PROJECTION_CODE';
export const SET_LAYER_SPLIT_MODE = 'SET_LAYER_SPLIT_MODE';
export const SET_LAYER_SPLIT_POSITION = 'SET_LAYER_SPLIT_POSITION';
export const SET_SELECTED_ENTITY_ID = 'SET_SELECTED_ENTITY_ID';
export const INC_ENTITY_UPDATE_COUNT = 'INC_ENTITY_UPDATE_COUNT';
export const UPDATE_ENTITY_STYLE = 'UPDATE_ENTITY_STYLE';
export const UPDATE_MOUSE_IDLE_STATE = 'UPDATE_MOUSE_IDLE_STATE';

export function setViewMode(viewId: string, viewMode: WorldViewMode): Action {
    return {type: SET_VIEW_MODE, payload: {viewId, viewMode}};
}

export function setLayerSplitMode(viewId: string, layerId: string, splitMode: SplitMode): Action {
    return {type: SET_LAYER_SPLIT_MODE, payload: {viewId, layerId, splitMode}};
}

export function setLayerSplitPosition(viewId: string, layerSplitPosition: number): Action {
    return {type: SET_LAYER_SPLIT_POSITION, payload: {viewId, layerSplitPosition}};
}

export function notifySelectedEntityChange(viewId: string, layer: LayerState | null, selectedEntity: Cesium.Entity | null): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {

        const selectedEntityId = selectedEntity && selectedEntity.id;
        dispatch(setSelectedEntityId(viewId, isDefined(selectedEntityId) ? selectedEntityId : null));

        if (selectedEntity
            && isNumber(selectedEntity._simp)
            && isNumber(selectedEntity._resId)
            && isNumber(selectedEntity._idx)) {
            const isGeometrySimplified = (selectedEntity._simp & 0x01) != 0;
            if (isGeometrySimplified) {
                const workspace = selectors.workspaceSelector(getState());
                if (workspace) {
                    const resId = selectedEntity._resId;
                    const featureIndex = +selectedEntity._idx;
                    const baseUrl = selectors.restUrlSelector(getState());
                    const baseDir = workspace.baseDir;
                    const featureUrl = getFeatureUrl(baseUrl, baseDir, {resId}, featureIndex);
                    reloadEntityWithOriginalGeometry(selectedEntity, featureUrl, (layer as any).style);
                }
            }
        }
    }
}

function setSelectedEntityId(viewId: string, selectedEntityId: string | null): Action {
    return {type: SET_SELECTED_ENTITY_ID, payload: {viewId, selectedEntityId}};
}

export function updateEntityStyle(view: ViewState<any>, entity: Cesium.Entity, style: SimpleStyle) {
    return (dispatch: Dispatch) => {
        const layer = getWorldViewVectorLayerForEntity(view, entity);
        // We cannot dispatch an action with an entity payload, because action logging will no longer work
        // (probably because Cesium Entities are not plain objects and contain numerous references
        // to other complex Cesium objects).
        // This is why we pass an the entity ID as payload.
        // However entity IDs are only unique within a Cesium Entity DataSource / Cate Vector Layer,
        // therefore must pass the layer ID and the entity ID to identify the entity.
        if (layer) {
            // We will only dispatch actions for entities belong to our own layers.
            if (layer.id === MY_PLACES_LAYER_ID) {
                // If this is the placemarks layer, we store the style change in the placemarks (= feature's)
                // properties: state.session.placemarkCollection.features[entityId].properties = ...style
                dispatch(updatePlacemarkStyle(entity.id, style));
            } else {
                // For all other layer we update the layer's entity styles:
                // properties: state.control.views[viewId].data.layers[layerId].entityStyles[entityId] = style
                dispatch(updateEntityStyleImpl(view.id, layer.id, entity.id, style));
            }
        }
        dispatch(incEntityUpdateCount());
    };
}

function updateEntityStyleImpl(viewId: string, layerId: string, entityId: string, style: SimpleStyle): Action {
    return {type: UPDATE_ENTITY_STYLE, payload: {viewId, layerId, entityId, style}};
}

function incEntityUpdateCount(): Action {
    return {type: INC_ENTITY_UPDATE_COUNT};
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Table view actions

export const UPDATE_TABLE_VIEW_DATA = 'UPDATE_TABLE_VIEW_DATA';

export function updateTableViewData(viewId: string,
                                    resName: string | null,
                                    varName: string | null,
                                    dataRows?: any[] | null,
                                    error?: any,
                                    isLoading?: boolean): Action {
    dataRows = dataRows || null;
    error = error || null;
    isLoading = isLoading || false;
    return {type: UPDATE_TABLE_VIEW_DATA, payload: {viewId, resName, varName, dataRows, error, isLoading}};
}

export function loadTableViewData(viewId: string, resName: string, varName: string | null): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const restUrl = selectors.restUrlSelector(getState());
        const baseDir = selectors.workspaceBaseDirSelector(getState());
        const resource = selectors.resourcesSelector(getState()).find(res => res.name === resName);
        if (resource) {
            const csvUrl = getCsvUrl(restUrl, baseDir, {resId: resource.id}, varName);
            dispatch(updateTableViewData(viewId, resName, varName, null, null, true));
            d3.csv(csvUrl)
              .then((dataRows: any[]) => {
                  dispatch(updateTableViewData(viewId, resName, varName, dataRows, null, false));
              })
              .catch((error: any) => {
                  dispatch(updateTableViewData(viewId, resName, varName, null, error, false));
              });
        }
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Animation view actions

export const UPDATE_ANIMATION_VIEW_DATA = 'UPDATE_ANIMATION_VIEW_DATA';

export function loadAnimationViewData(viewId: string, resId: number): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const restUrl = selectors.restUrlSelector(getState());
        const baseDir = selectors.workspaceBaseDirSelector(getState());
        const htmlUrl = getHtmlUrl(restUrl, baseDir, resId);

        const xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState == 4) {
                dispatch(setAnimationResult(viewId, xmlHttp.responseText, xmlHttp.status));
            }
        };
        xmlHttp.open('GET', htmlUrl, true); // true for asynchronous
        xmlHttp.send(null);
    }
}

function setAnimationResult(viewId: string, innerHTML: string, status: number) {
    return {type: UPDATE_ANIMATION_VIEW_DATA, payload: {viewId, innerHTML, status}}
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Layer actions

export const SET_SELECTED_LAYER_ID = 'SET_SELECTED_LAYER_ID';
export const ADD_LAYER = 'ADD_LAYER';
export const REMOVE_LAYER = 'REMOVE_LAYER';
export const UPDATE_LAYER = 'UPDATE_LAYER';
export const UPDATE_LAYER_STYLE = 'UPDATE_LAYER_STYLE';
export const MOVE_LAYER_UP = 'MOVE_LAYER_UP';
export const MOVE_LAYER_DOWN = 'MOVE_LAYER_DOWN';
export const SAVE_LAYER = 'SAVE_LAYER';

export function setSelectedLayerId(viewId: string, selectedLayerId: string | null): Action {
    return {type: SET_SELECTED_LAYER_ID, payload: {viewId, selectedLayerId}};
}

export function addLayer(viewId: string, layer: LayerState, selectLayer: boolean): Action {
    return {type: ADD_LAYER, payload: {viewId, layer, selectLayer}};
}

export function removeLayer(viewId: string, id: string): Action {
    return {type: REMOVE_LAYER, payload: {viewId, id}};
}

export function moveLayerUp(viewId: string, id: string): Action {
    return {type: MOVE_LAYER_UP, payload: {viewId, id}};
}

export function moveLayerDown(viewId: string, id: string): Action {
    return {type: MOVE_LAYER_DOWN, payload: {viewId, id}};
}

export function updateLayer(viewId: string, layer: LayerState, ...layerProperties): ThunkAction {
    return (dispatch: Dispatch) => {
        if (layerProperties.length) {
            layer = updateObject({}, layer, ...layerProperties);
        }
        dispatch(updateLayerImpl(viewId, layer));
        if (layer.id === AUTO_LAYER_ID) {
            const varName = (layer as VariableLayerBase).varName;
            if (varName) {
                dispatch(saveLayer(varName, layer));
            }
        }
    };
}

function updateLayerImpl(viewId: string, layer: LayerState): Action {
    return {type: UPDATE_LAYER, payload: {viewId, layer}};
}

export function updateLayerStyle(viewId: string, layerId: string, style: SimpleStyle): Action {
    return {type: UPDATE_LAYER_STYLE, payload: {viewId, layerId, style}};
}

/**
 * Save layer (in state.session), so it can later be restored.
 *
 * @param key a key
 * @param layer layer data
 * @returns {{type: string, payload: {key: string, layer: LayerState}}}
 */
export function saveLayer(key: string, layer: LayerState): Action {
    return {type: SAVE_LAYER, payload: {key, layer}};
}

export function setStyleContext(styleContext: string) {
    return updateSessionState({styleContext});
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
export function loadColorMaps(): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        function call() {
            return selectors.colorMapsAPISelector(getState()).getColorMaps();
        }

        function action(colorMaps: Array<ColorMapCategoryState>) {
            dispatch(updateColorMaps(colorMaps));
        }

        callAPI({title: 'Load color maps', dispatch, call, action});
    }
}

function updateColorMaps(colorMaps: Array<ColorMapCategoryState>): Action {
    return {type: UPDATE_COLOR_MAPS, payload: {colorMaps}};
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// (User) Preferences actions

export function showPreferencesDialog() {
    return showDialog('preferencesDialog');
}

export function hidePreferencesDialog() {
    return hideDialog('preferencesDialog');
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Native, Electron-based dialogs, file choosers and message boxes

export interface FileFilter {
    name: string;
    extensions: string[];
}

export type OpenDialogProperty =
    'openFile'
    | 'openDirectory'
    | 'multiSelections'
    | 'createDirectory'
    | 'showHiddenFiles';

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

    /**
     * If provided, the message box will include a checkbox with the given label.
     * The checkbox state can be inspected only when using callback.
     */
    checkboxLabel?: string;

    /**
     * Initial checked state of the checkbox. false by default.
     */
    checkboxChecked?: boolean;
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
                                         callback?: (filePath: string) => void): string | null {
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
                                        callback?: (filePaths: string[]) => void): string[] | null {
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
                                   callback?: (filePaths: string[]) => void): string[] | null {
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
        return electron.ipcRenderer.sendSync(actionName, openDialogOptions, true) as any;
    }
}

/**
 * Shows a native file-save dialog.
 *
 * @param saveDialogOptions the file-save dialog options, see https://github.com/electron/electron/blob/master/docs/api/dialog.md
 * @param callback an optional function which is called with the selected file path
 * @returns the selected filePath or null, if no file path was selected or the callback function is defined
 */
export function showFileSaveDialog(saveDialogOptions: SaveDialogOptions, callback?: (filePath: string) => void): string
    | null {
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
        return electron.ipcRenderer.sendSync(actionName, saveDialogOptions, true) as any;
    }
}

/**
 * Shows a native message box.
 * Note, this is not an action.
 *
 * @param messageBoxOptions the message dialog options, see https://github.com/electron/electron/blob/master/docs/api/dialog.md
 * @param callback an optional function which is called with (buttonIndex, checkboxChecked)
 * @returns null, if no button was selected or the callback function is defined. Otherwise an object {buttonIndex, checkboxChecked}.
 */
export function showMessageBox(messageBoxOptions: MessageBoxOptions, callback?: (buttonIndex: number, checkboxChecked: boolean) => void): { buttonIndex: number, checkboxChecked: boolean } | null {
    const electron = require('electron');
    if (!electron) {
        console.warn('showMessageBox() cannot be executed, electron not available from renderer process');
        return;
    }
    const actionName = 'show-message-box';
    if (!messageBoxOptions.buttons) {
        messageBoxOptions = {...messageBoxOptions, buttons: ['OK']};
    }
    if (callback) {
        electron.ipcRenderer.send(actionName, messageBoxOptions, false);
        electron.ipcRenderer.once(actionName + '-reply', (event, buttonIndex: number, checkboxChecked: boolean) => {
            callback(buttonIndex, checkboxChecked);
        });
        return null;
    } else {
        return electron.ipcRenderer.sendSync(actionName, messageBoxOptions, true) as any;
    }
}

//noinspection JSUnusedGlobalSymbols
/**
 * Show the given file in a file manager. If possible, select the file.
 * @param fullPath
 */
export function showItemInFolder(fullPath: string): boolean {
    const electron = require('electron');
    if (!electron) {
        console.warn('showItemInFolder() cannot be executed, electron not available from renderer process');
        return false;
    }
    return electron.shell.showItemInFolder(fullPath);
}

/**
 * Open the given file in the desktop's default manner.
 * @param fullPath
 */
export function openItem(fullPath: string): boolean {
    const electron = require('electron');
    if (!electron) {
        console.warn('openItem() cannot be executed, electron not available from renderer process');
        return false;
    }
    return electron.shell.openItem(fullPath);
}

/**
 * Open the given URL in the desktop's default manner.
 *
 * @param url The URL.
 * @returns {boolean}
 */
export function openExternal(url: string): boolean {
    const electron = require('electron');
    if (!electron) {
        console.warn('openExternal() cannot be executed, electron not available from renderer process');
        return false;
    }
    return electron.shell.openExternal(url);
}


/**
 * Copies given text to clipboard.
 * @param text The text to be copied.
 */
export function copyTextToClipboard(text: string) {
    const electron = require('electron');
    electron.clipboard.writeText(text);
    // console.log(`copied to clipboard: [${text}]`);
}


/**
 * Update frontend preferences (but not backend configuration).
 *
 * @param callback an optional function which is called with the selected button index
 * @returns the selected button index or null, if no button was selected or the callback function is defined
 */
export function sendPreferencesToMain(callback?: (error: any) => void): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const electron = require('electron');
        if (!electron || !electron.ipcRenderer) {
            console.warn('sendPreferencesToMain() cannot be executed, electron/electron.ipcRenderer not available from renderer process');
            return;
        }
        const session = getState().session;
        const preferences = Object.assign({}, session);
        const excludedPreferenceNames = [
            'backendConfig',           // treated differently, see storeBackendConfig
            'mainWindowBounds',        // use current value from main process
            'devToolsOpened',          // use current value from main process
            'suppressQuitConfirm',     // use current value from main process
        ];
        excludedPreferenceNames.forEach(propertyName => {
            if (preferences.hasOwnProperty(propertyName)) {
                delete preferences[propertyName];
            }
        });
        const actionName = 'set-preferences';
        electron.ipcRenderer.send(actionName, preferences);
        if (callback) {
            electron.ipcRenderer.once(actionName + '-reply', (event, error: any) => {
                callback(error);
            });
        }
    };
}
