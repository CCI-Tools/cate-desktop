import {
    State, DataState, LocationState, SessionState, CommunicationState, ControlState, DataStoreState,
    LayerState
} from './state';
import * as actions from './actions';
import * as assert from "../common/assert";
import {combineReducers} from 'redux';
import {updateObject, updatePropertyObject} from "../common/objutil";
import {
    SELECTED_VARIABLE_LAYER_ID, newWorldView, updateSelectedVariableLayer, newChartView,
    newTableView, newFigureView
} from "./state-util";
import {
    removeViewFromLayout, removeViewFromViewArray, ViewState, addViewToViewArray,
    addViewToLayout, selectViewInLayout, getViewPanel, findViewPanel, splitViewPanel, changeViewSplitPos, addViewToPanel
} from "./components/ViewState";

// Note: reducers are unit-tested through actions.spec.ts

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// state.data initial state and reducers

const initialDataState: DataState = {
    appConfig: {
        webAPIConfig: {
            servicePort: -1,
            serviceAddress: '',
            restUrl: '',
            apiWebSocketUrl: '',
            mplWebSocketUrl: '',
        },
        webAPIClient: null,
    },
    dataStores: null,
    operations: null,
    workspace: null,
    colorMaps: null
};

const updateDataStores = (state: DataState, action, createDataSources: (dataStore: DataStoreState) => void): DataStoreState[] => {
    const dataStoreId = action.payload.dataStoreId;
    const dataStoreIndex = state.dataStores.findIndex(dataStore => dataStore.id === dataStoreId);
    if (dataStoreIndex < 0) {
        throw Error('illegal data store ID: ' + dataStoreId);
    }
    const oldDataStore = state.dataStores[dataStoreIndex];
    const newDataSources = createDataSources(oldDataStore);
    const newDataStore = updateObject(oldDataStore, {dataSources: newDataSources});
    const newDataStores = state.dataStores.slice();
    newDataStores[dataStoreIndex] = newDataStore;
    return updateObject(state, {dataStores: newDataStores});
};

const dataReducer = (state: DataState = initialDataState, action) => {
    switch (action.type) {
        case actions.UPDATE_INITIAL_STATE:
            const appConfig = updateObject(state.appConfig, action.payload.appConfig);
            return updateObject(state, {appConfig});
        case actions.SET_WEBAPI_STATUS: {
            const webAPIClient = action.payload.webAPIClient;
            const appConfig = updateObject(state.appConfig, {webAPIClient});
            return updateObject(state, {appConfig});
        }
        case actions.UPDATE_OPERATIONS: {
            const operations = action.payload.operations;
            return updateObject(state, {operations});
        }
        case actions.SET_CURRENT_WORKSPACE: {
            const workspace = action.payload.workspace;
            return {...state, workspace};
        }
        case actions.UPDATE_COLOR_MAPS: {
            const colorMaps = action.payload.colorMaps;
            return updateObject(state, {colorMaps});
        }
        case actions.UPDATE_DATA_STORES: {
            const dataStores = action.payload.dataStores.slice();
            return updateObject(state, {dataStores});
        }
        case actions.UPDATE_DATA_SOURCES: {
            return updateDataStores(state, action, () => {
                return action.payload.dataSources.slice();
            });
        }
        case actions.UPDATE_DATA_SOURCE_TEMPORAL_COVERAGE: {
            return updateDataStores(state, action, dataStore => {
                const newDataSources = dataStore.dataSources.slice();
                const dataSourceId = action.payload.dataSourceId;
                const temporalCoverage = action.payload.temporalCoverage;
                const dataSourceIndex = newDataSources.findIndex(dataSource => dataSource.id === dataSourceId);
                if (dataSourceIndex < 0) {
                    throw Error('illegal data source ID: ' + dataSourceId);
                }
                const oldDataSource = newDataSources[dataSourceIndex];
                newDataSources[dataSourceIndex] = updateObject({}, oldDataSource, {temporalCoverage});
                return newDataSources;
            });
        }
    }
    return state;
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// state.control initial state and reducers

const initialView = newWorldView();

const initialControlState: ControlState = {
    selectedDataStoreId: null,
    selectedDataSourceId: null,
    dataSourceFilterExpr: '',
    selectedOperationName: null,
    operationFilterTags: [],
    operationFilterExpr: '',
    selectedWorkflowStepId: null,
    selectedWorkspaceResourceId: null,
    selectedVariableName: null,
    savedLayers: {},
    dialogs: {},

    // TODO (forman): move to session, so they are stored in preferences
    showDataSourceDetails: true,
    showResourceDetails: true,
    showWorkflowStepDetails: true,
    showOperationDetails: true,
    showVariableDetails: true,
    showLayerDetails: true,

    views: [initialView],
    viewLayout: {
        viewIds: [initialView.id],
        selectedViewId: initialView.id,
    },
    activeViewId: initialView.id,
};


const controlReducer = (state: ControlState = initialControlState, action) => {
    switch (action.type) {
        case actions.RENAME_RESOURCE: {
            const resName = action.payload.resName;
            const newResName = action.payload.newResName;
            let selectedWorkspaceResourceId = state.selectedWorkspaceResourceId;
            if (selectedWorkspaceResourceId === resName) {
                selectedWorkspaceResourceId = newResName;
            }
            const views = viewsReducer(state.views, action);
            if (selectedWorkspaceResourceId !== state.selectedWorkspaceResourceId || views !== state.views) {
                return {...state, selectedWorkspaceResourceId, views};
            }
            return state;
        }
        case actions.UPDATE_DATA_SOURCES: {
            const dataSources = action.payload.dataSources;
            const selectedDataSourceId = (dataSources && dataSources.length) ? dataSources[0].id : null;
            return {...state, selectedDataSourceId};
        }
        case actions.UPDATE_OPERATIONS: {
            const operations = action.payload.operations;
            const selectedOperationName = (operations && operations.length) ? operations[0].name : null;
            return {...state, selectedOperationName};
        }
        case actions.SAVE_LAYER: {
            const key = action.payload.key;
            const layer = action.payload.layer;
            const savedLayers = updateObject(state.savedLayers, {[key]: updateObject(layer, {})});
            return {...state, savedLayers};
        }
        case actions.SET_SELECTED_VARIABLE: {
            const selectedVariable = action.payload.selectedVariable;
            const selectedVariableName = selectedVariable ? selectedVariable.name : null;
            let views = state.views;
            const newViews = viewsReducer(state.views, action);
            if (newViews !== views) {
                views = newViews;
            }
            return {...state, selectedVariableName, views};
        }
        case actions.UPDATE_CONTROL_STATE:
            return {...state, ...action.payload};
        case actions.UPDATE_DIALOG_STATE: {
            const dialogs = updatePropertyObject(state.dialogs, action.payload.dialogId, action.payload.dialogState);
            return {...state, dialogs};
        }
        case actions.ADD_WORLD_VIEW: {
            const view = newWorldView();
            return addView(state, view, action.payload.placeAfterViewId);
        }
        case actions.ADD_FIGURE_VIEW: {
            const view = newFigureView();
            return addView(state, view, action.payload.placeAfterViewId);
        }
        case actions.ADD_TABLE_VIEW: {
            const resName = state.selectedWorkspaceResourceId;
            const varName = state.selectedVariableName;
            const view = newTableView(resName, varName);
            return addView(state, view, action.payload.placeAfterViewId);
        }
        case actions.SELECT_VIEW: {
            const viewPath = action.payload.viewPath;
            const viewId = action.payload.viewId;
            const viewLayout = selectViewInLayout(state.viewLayout, viewPath, viewId);
            return {...state, viewLayout, activeViewId: viewId};
        }
        case actions.CLOSE_VIEW: {
            const viewPath = action.payload.viewPath;
            const viewId = action.payload.viewId;
            const views = removeViewFromViewArray(state.views, viewId);
            const viewLayout = removeViewFromLayout(state.viewLayout, viewPath, viewId);
            let activeViewId = state.activeViewId;
            if (activeViewId === viewId) {
                activeViewId = null;
                let viewPanel = getViewPanel(viewLayout, viewPath);
                if (viewPanel && viewPanel.selectedViewId) {
                    activeViewId = viewPanel.selectedViewId;
                } else {
                    viewPanel = findViewPanel(viewLayout, viewPanel => !!viewPanel.selectedViewId);
                    if (viewPanel) {
                        activeViewId = viewPanel.selectedViewId;
                    }
                }
            }
            return {...state, viewLayout, views, activeViewId};
        }
        case actions.SPLIT_VIEW_PANEL: {
            const viewPath = action.payload.viewPath;
            const dir = action.payload.dir;
            const pos = action.payload.pos;
            const viewLayout = splitViewPanel(state.viewLayout, viewPath, dir, pos);
            return {...state, viewLayout};
        }
        case actions.CHANGE_VIEW_SPLIT_POS:{
            const viewPath = action.payload.viewPath;
            const delta = action.payload.delta;
            const viewLayout = changeViewSplitPos(state.viewLayout, viewPath, delta);
            return {...state, viewLayout};
        }
        default: {
            const newViews = viewsReducer(state.views, action);
            if (newViews !== state.views) {
                return {...state, views: newViews};
            }
        }
    }

    return state;
};


function addView(state: ControlState, view: ViewState<any>, placeAfterViewId: string|null) {
    const newId = view.id;
    const newViews = addViewToViewArray(state.views, view);
    const oldViewLayout = state.viewLayout;
    let newViewLayout;
    if (placeAfterViewId) {
        newViewLayout = addViewToPanel(oldViewLayout, placeAfterViewId, newId);
    }
    if (!newViewLayout || newViewLayout === oldViewLayout) {
        // Could not be inserted, so use following call which will always succeed.
        newViewLayout = addViewToLayout(oldViewLayout, newId);
    }
    return {...state, viewLayout: newViewLayout, views: newViews, activeViewId: newId};
}


const viewsReducer = (state: ViewState<any>[], action) => {
    // delegate action to all children
    let newViews = null;
    for (let i = 0; i < state.length; i++) {
        const oldView = state[i];
        const newView = viewReducer(oldView, action);
        if (oldView !== newView) {
            if (!newViews) {
                newViews = state.slice(0, i);
            }
        }
        if (newViews && newView) {
            newViews.push(newView);
        }
    }
    return newViews || state;
};


const viewReducer = (state: ViewState<any>, action) => {
    switch (action.type) {
        case actions.RENAME_RESOURCE: {
            if (state.type === 'world') {
                const layers = layersReducer(state.data.layers, action);
                if (layers !== state.data.layers) {
                    return {...state, data: {...state.data, layers}};
                }
            }
            break;
        }
        case actions.SET_SHOW_SELECTED_VARIABLE_LAYER: {
            if (state.type === 'world') {
                const layers = layersReducer(state.data.layers, action);
                if (layers !== state.data.layers) {
                    return {...state, data: {...state.data, layers}};
                }
            }
            break;
        }
        case actions.SET_SELECTED_LAYER_ID: {
            const viewId = action.payload.viewId;
            if (viewId === state.id && state.type === 'world') {
                const selectedLayerId = action.payload.selectedLayerId;
                return {...state, data: {...state.data, selectedLayerId}};
            }
            break;
        }
        case actions.SET_VIEW_MODE: {
            const viewId = action.payload.viewId;
            if (viewId === state.id) {
                assert.ok(state.type === 'world');
                const viewMode = action.payload.viewMode;
                return {...state, data: {...state.data, viewMode}};
            }
            break;
        }
        case actions.SET_PROJECTION_CODE: {
            const viewId = action.payload.viewId;
            if (viewId === state.id) {
                assert.ok(state.type === 'world');
                const projectionCode = action.payload.projectionCode;
                return {...state, data: {...state.data, projectionCode}};
            }
            break;
        }
        case actions.ADD_LAYER: {
            const viewId = action.payload.viewId;
            if (viewId === state.id) {
                assert.ok(state.type === 'world');
                const layer = action.payload.layer;
                const selectLayer = action.payload.selectLayer;
                const selectedLayerId = selectLayer ? layer.id : state.data.selectedLayerId;
                const layers = state.data.layers.concat([layer]);
                return {...state, data: {...state.data, layers, selectedLayerId}};
            }
            break;
        }
        case actions.REMOVE_LAYER: {
            const viewId = action.payload.viewId;
            if (viewId === state.id) {
                assert.ok(state.type === 'world');
                const layerId = action.payload.id;
                const layers = state.data.layers.slice();
                let selectedLayerId = state.data.selectedLayerId;
                if (layerId === selectedLayerId) {
                    selectedLayerId = null;
                }
                const layerIndex = layers.findIndex(l => l.id === layerId);
                if (layerIndex >= 0) {
                    layers.splice(layerIndex, 1);
                    return {...state, data: {...state.data, layers, selectedLayerId}};
                }
            }
            break;
        }
        case actions.MOVE_LAYER_UP: {
            const viewId = action.payload.viewId;
            if (viewId === state.id) {
                assert.ok(state.type === 'world');
                const layerId = action.payload.id;
                const layers = state.data.layers.slice();
                const layerIndex = layers.findIndex(l => l.id === layerId);
                assert.ok(layerIndex >= 0, "layerIndex >= 0");
                if (layerIndex > 0) {
                    const temp = layers[layerIndex - 1];
                    layers[layerIndex - 1] = layers[layerIndex];
                    layers[layerIndex] = temp;
                    return {...state, data: {...state.data, layers}};
                }
            }
            break;
        }
        case actions.MOVE_LAYER_DOWN: {
            const viewId = action.payload.viewId;
            if (viewId === state.id) {
                assert.ok(state.type === 'world');
                const layerId = action.payload.id;
                const layers = state.data.layers.slice();
                const layerIndex = layers.findIndex(l => l.id === layerId);
                assert.ok(layerIndex >= 0, "layerIndex >= 0");
                if (layerIndex >= 0 && layerIndex < layers.length - 1) {
                    const temp = layers[layerIndex + 1];
                    layers[layerIndex + 1] = layers[layerIndex];
                    layers[layerIndex] = temp;
                    return {...state, data: {...state.data, layers}};
                }
            }
            break;
        }
        case actions.UPDATE_LAYER: {
            const viewId = action.payload.viewId;
            if (viewId === state.id) {
                assert.ok(state.type === 'world');
                const layer = action.payload.layer;
                const layers = state.data.layers.slice();
                const layerIndex = layers.findIndex(l => l.id === layer.id);
                assert.ok(layerIndex >= 0, "layerIndex >= 0");
                layers[layerIndex] = updateObject(layers[layerIndex], layer);
                return {...state, data: {...state.data, layers}};
            }
            break;
        }
        case actions.UPDATE_TABLE_VIEW_DATA: {
            const viewId = action.payload.viewId;
            if (viewId === state.id) {
                assert.ok(state.type === 'table');
                const data = {...state.data, ...action.payload};
                return {...state, data};
            }
            break;
        }
        default: {
            if (state.type === 'world') {
                const layers = layersReducer(state.data.layers, action);
                if (layers !== state.data.layers) {
                    return {...state, data: {...state.data, layers}};
                }
            }
        }
    }
    return state;
};

const layersReducer = (state: LayerState[], action) => {
    // delegate action to all children
    let newLayers;
    for (let i = 0; i < state.length; i++) {
        const oldLayer = state[i];
        const newLayer = layerReducer(oldLayer, action);
        if (oldLayer !== newLayer) {
            if (!newLayers) {
                newLayers = state.slice(0, i);
            }
        }
        if (newLayers && newLayer) {
            newLayers.push(newLayer);
        }
    }
    return newLayers || state;
};

const layerReducer = (state: LayerState, action) => {
    switch (action.type) {
        case actions.RENAME_RESOURCE: {
            const resName = action.payload.resName;
            const newResName = action.payload.newResName;
            if ((state as any).resName === resName) {
                return {...state, resName: newResName};
            }
            break;
        }
        case actions.SET_SHOW_SELECTED_VARIABLE_LAYER: {
            if (state.id === SELECTED_VARIABLE_LAYER_ID) {
                const showSelectedVariableLayer = action.payload.showSelectedVariableLayer;
                return {...state, visible: showSelectedVariableLayer};
            }
            break;
        }
        case actions.SET_SELECTED_VARIABLE: {
            if (state.id === SELECTED_VARIABLE_LAYER_ID) {
                const resource = action.payload.resource;
                const selectedVariable = action.payload.selectedVariable;
                const savedLayers = action.payload.savedLayers;
                return updateSelectedVariableLayer(state, resource, selectedVariable, savedLayers);
            }
            break;
        }
    }
    return state;
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// state.session initial state and reducers

const initialSessionState: SessionState = {
    reopenLastWorkspace: false,
    lastWorkspacePath: null,
    resourceNamePrefix: 'res_',
    offlineMode: false,
    showSelectedVariableLayer: true,

    panelContainerUndockedMode: false,
    leftPanelContainerLayout: {horPos: 300, verPos: 600},
    rightPanelContainerLayout: {horPos: 300, verPos: 300},
    selectedLeftTopPanelId: 'dataSources',
    selectedLeftBottomPanelId: 'workspace',
    selectedRightTopPanelId: 'variables',
    selectedRightBottomPanelId: 'layers',

    backendConfig: {
        dataStoresPath: null,
        useWorkspaceImageryCache: false,
    }
};

const sessionReducer = (state: SessionState = initialSessionState, action) => {
    switch (action.type) {
        case actions.UPDATE_INITIAL_STATE:
            return {...state, ...action.payload.session};
        case actions.UPDATE_SESSION_STATE:
            return {...state, ...action.payload};
        case actions.SET_SHOW_SELECTED_VARIABLE_LAYER:
            return {...state, ...action.payload};
    }
    return state;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// state.communication initial state and reducers

const initialCommunicationState: CommunicationState = {
    webAPIStatus: null,
    tasks: {}
};

const communicationReducer = (state: CommunicationState = initialCommunicationState, action) => {
    switch (action.type) {
        case actions.SET_WEBAPI_STATUS:
            return updateObject(state, {webAPIStatus: action.payload.webAPIStatus});
        case actions.UPDATE_TASK_STATE:
            return updateObject(state, {
                tasks: updatePropertyObject(state.tasks, action.payload.jobId, action.payload.taskState)
            });
        case actions.REMOVE_TASK_STATE: {
            const tasks = Object.assign({}, state.tasks);
            delete tasks[action.payload.jobId];
            return updateObject(state, {tasks: tasks});
        }
    }
    return state;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// state.location initial state and reducers


const initialLocationState: LocationState = {
    webAPIStatus: null
};

//noinspection JSUnusedLocalSymbols
const locationReducer = (state: LocationState = initialLocationState, action) => {
    return state;
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Combined State reducer

export const stateReducer = combineReducers<State>({
    data: dataReducer,
    control: controlReducer,
    session: sessionReducer,
    communication: communicationReducer,
    location: locationReducer,
});
