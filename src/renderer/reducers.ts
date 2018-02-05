import {
    State, DataState, LocationState, SessionState, CommunicationState, ControlState, DataStoreState,
    LayerState, Placemark, VectorLayerBase
} from './state';
import * as actions from './actions';
import * as assert from "../common/assert";
import {combineReducers, Reducer} from 'redux';
import {updateObject, updatePropertyObject} from "../common/objutil";
import {
    SELECTED_VARIABLE_LAYER_ID, updateSelectedVariableLayer,
    newWorldView, newTableView, newFigureView, getFigureViewTitle, genPlacemarkId,
    hasWebGL, isVectorLayer,
} from "./state-util";
import {
    removeViewFromLayout, removeViewFromViewArray, ViewState, addViewToViewArray,
    addViewToLayout, selectViewInLayout, getViewPanel, findViewPanel, splitViewPanel, changeViewSplitPos,
    addViewToPanel, moveView, selectView
} from "./components/ViewState";
import {Action, SET_GLOBE_MOUSE_POSITION, SET_GLOBE_VIEW_POSITION} from "./actions";
import {isString} from "../common/types";
import deepEqual = require("deep-equal");

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
        hasWebGL: hasWebGL(),
    },
    dataStores: null,
    operations: null,
    workspace: null,
    colorMaps: null
};

const updateDataStores = (state: DataState, action: Action, createDataSources: (dataStore: DataStoreState) => void): DataStoreState[] => {
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

const dataReducer = (state: DataState = initialDataState, action: Action) => {
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
    selectedWorkflowStepId: null,
    selectedWorkspaceResourceName: null,
    selectedVariableName: null,
    dialogs: {},

    views: [initialView],
    viewLayout: {
        viewIds: [initialView.id],
        selectedViewId: initialView.id,
    },
    activeViewId: initialView.id,

    worldViewClickAction: null,

    entityUpdateCount: 0,
};


const controlReducer = (state: ControlState = initialControlState, action: Action) => {
    switch (action.type) {
        case actions.RENAME_RESOURCE: {
            const resName = action.payload.resName;
            const newResName = action.payload.newResName;

            // Rename resName in selectedWorkspaceResourceName
            let selectedWorkspaceResourceName = state.selectedWorkspaceResourceName;
            if (selectedWorkspaceResourceName === resName) {
                selectedWorkspaceResourceName = newResName;
            }

            // Rename resName in views and their layers
            const views = viewsReducer(state.views, action, state.activeViewId);

            if (selectedWorkspaceResourceName !== state.selectedWorkspaceResourceName
                || views !== state.views) {
                return {...state, selectedWorkspaceResourceName, views};
            }
            return state;
        }
        case actions.UPDATE_ENTITY_STYLE: {
            const views = viewsReducer(state.views, action, state.activeViewId);
            if (views !== state.views) {
                return {...state, views};
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
        case actions.SET_SELECTED_VARIABLE: {
            const selectedVariable = action.payload.selectedVariable;
            const selectedVariableName = selectedVariable ? selectedVariable.name : null;
            let views = state.views;
            const newViews = viewsReducer(state.views, action, state.activeViewId);
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
        case actions.SHOW_FIGURE_VIEW: {
            const {resource, placeAfterViewId} = action.payload;
            const figureView = state.views.find(v => v.type === 'figure' && resource.id === v.data.resourceId);
            if (figureView) {
                const viewLayout = selectView(state.viewLayout, figureView.id);
                return {...state, viewLayout};
            } else {
                const view = newFigureView(resource);
                return addView(state, view, placeAfterViewId);
            }
        }
        case actions.SHOW_TABLE_VIEW: {
            const {resName, varName, placeAfterViewId} = action.payload;
            // TODO: use resource.id, not .name!!!
            const tableView = state.views.find(v => v.type === 'table' && v.data.resName === resName && v.data.varName === varName);
            if (tableView) {
                const viewLayout = selectView(state.viewLayout, tableView.id);
                return {...state, viewLayout};
            } else {
                const view = newTableView(resName, varName);
                return addView(state, view, placeAfterViewId);
            }
        }
        case actions.ADD_TABLE_VIEW: {
            const {placeAfterViewId, resName, varName} = action.payload;
            const view = newTableView(resName, varName);
            return addView(state, view, placeAfterViewId);
        }
        case actions.SELECT_VIEW: {
            const {viewPath, viewId} = action.payload;
            const viewLayout = selectViewInLayout(state.viewLayout, viewPath, viewId);
            return {...state, viewLayout, activeViewId: viewId};
        }
        case actions.MOVE_VIEW: {
            const {sourceViewId, placement, targetViewId} = action.payload;
            const viewLayout = moveView(state.viewLayout, sourceViewId, placement, targetViewId);
            let activeViewId = state.activeViewId;
            if (activeViewId) {
                const containsActiveId = viewPanel => viewPanel.viewIds.indexOf(activeViewId) >= 0;
                const activeViewPanel = findViewPanel(viewLayout, containsActiveId);
                if (activeViewPanel && activeViewPanel.selectedViewId !== activeViewId) {
                    activeViewId = activeViewPanel.selectedViewId;
                }
            }
            return {...state, viewLayout, activeViewId};
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
        case actions.CHANGE_VIEW_SPLIT_POS: {
            const viewPath = action.payload.viewPath;
            const delta = action.payload.delta;
            const viewLayout = changeViewSplitPos(state.viewLayout, viewPath, delta);
            return {...state, viewLayout};
        }
        case actions.INC_ENTITY_UPDATE_COUNT: {
            const entityUpdateCount = state.entityUpdateCount + 1;
            return {...state, entityUpdateCount};
        }
        default: {
            const newViews = viewsReducer(state.views, action, state.activeViewId);
            if (newViews !== state.views) {
                return {...state, views: newViews};
            }
        }
    }

    return state;
};


function addView(state: ControlState, view: ViewState<any>, placeAfterViewId: string | null) {
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


const viewsReducer = (state: ViewState<any>[], action: Action, activeViewId: string) => {
    // delegate action to all children
    let newViews = null;
    for (let i = 0; i < state.length; i++) {
        const oldView = state[i];
        const newView = viewReducer(oldView, action, activeViewId);
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


const viewReducer = (state: ViewState<any>, action: Action, activeViewId: string) => {
    const isActiveView = state.id === activeViewId;
    switch (action.type) {
        case actions.RENAME_RESOURCE: {
            if (state.type === 'world') {
                const layers = layersReducer(state.data.layers, action, isActiveView);
                if (layers !== state.data.layers) {
                    return {...state, data: {...state.data, layers}};
                }
            } else if (state.type === 'figure') {
                let title = getFigureViewTitle(action.payload.resName);
                if (state.title === title) {
                    title = getFigureViewTitle(action.payload.newResName);
                    return {...state, title};
                }
            }
            break;
        }
        case actions.UPDATE_ENTITY_STYLE: {
            const viewId = action.payload.viewId;
            if (state.id === viewId && state.type === 'world') {
                const layers = layersReducer(state.data.layers, action, isActiveView);
                if (layers !== state.data.layers) {
                    return {...state, data: {...state.data, layers}};
                }
            }
            break;
        }
        case actions.SET_SHOW_SELECTED_VARIABLE_LAYER: {
            if (state.type === 'world') {
                const layers = layersReducer(state.data.layers, action, isActiveView);
                if (layers !== state.data.layers) {
                    return {...state, data: {...state.data, layers}};
                }
            }
            break;
        }
        // TODO (forman): clean up code duplication here, following actions are basically all the same
        //                SET_SELECTED_ENTITY_ID,
        //                SET_SELECTED_LAYER_ID,
        //                SET_VIEW_MODE,
        //                SET_PROJECTION_CODE,
        //                SET_SPLIT_LAYER_ID,
        //                SET_SPLIT_LAYER_POS
        //
        case actions.SET_SELECTED_LAYER_ID: {
            const viewId = action.payload.viewId;
            if (viewId === state.id && state.type === 'world') {
                const selectedLayerId = action.payload.selectedLayerId;
                return {...state, data: {...state.data, selectedLayerId}};
            }
            break;
        }
        case actions.SET_SELECTED_ENTITY_ID: {
            const viewId = action.payload.viewId;
            if (viewId === state.id && state.type === 'world') {
                const selectedEntityId = action.payload.selectedEntityId;
                return {...state, data: {...state.data, selectedEntityId}};
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
        case actions.SET_SELECTED_LAYER_SPLIT: {
            const viewId = action.payload.viewId;
            if (viewId === state.id) {
                assert.ok(state.type === 'world');
                const isSelectedLayerSplit = action.payload.isSelectedLayerSplit;
                return {...state, data: {...state.data, isSelectedLayerSplit}};
            }
            break;
        }
        case actions.SET_SELECTED_LAYER_SPLIT_POS: {
            const viewId = action.payload.viewId;
            if (viewId === state.id) {
                assert.ok(state.type === 'world');
                const selectedLayerSplitPos = action.payload.selectedLayerSplitPos;
                return {...state, data: {...state.data, selectedLayerSplitPos}};
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
        case actions.UPDATE_LAYER_STYLE: {
            const viewId = action.payload.viewId;
            if (viewId === state.id) {
                assert.ok(state.type === 'world');
                const {layerId, style} = action.payload;
                const layers = state.data.layers.slice();
                const layerIndex = layers.findIndex(l => l.id === layerId);
                assert.ok(layerIndex >= 0, "layerIndex >= 0");
                let layer = layers[layerIndex];
                layers[layerIndex] = {...layer, style: {...layer.style, ...style}};
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
                const layers = layersReducer(state.data.layers, action, isActiveView);
                if (layers !== state.data.layers) {
                    return {...state, data: {...state.data, layers}};
                }
            }
        }
    }
    return state;
};

const layersReducer = (state: LayerState[], action: Action, isActiveView: boolean) => {
    // delegate action to all children
    let newLayers;
    for (let i = 0; i < state.length; i++) {
        const oldLayer = state[i];
        const newLayer = layerReducer(oldLayer, action, isActiveView);
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

const layerReducer = (state: LayerState, action: Action, isActiveView: boolean) => {
    switch (action.type) {
        case actions.RENAME_RESOURCE: {
            const resName = action.payload.resName;
            const newResName = action.payload.newResName;
            if ((state as any).resName === resName) {
                return {...state, resName: newResName};
            }
            break;
        }
        case actions.UPDATE_ENTITY_STYLE: {
            const {layerId, entityId, style} = action.payload;
            if (state.id === layerId && isVectorLayer(state)) {
                const vectorLayer = state as VectorLayerBase;
                const entityStyles = vectorLayer.entityStyles;
                const oldStyle = entityStyles && entityStyles[entityId];
                const newStyle = {...oldStyle, ...style};
                if (!deepEqual(oldStyle, newStyle)) {
                    return {...state, entityStyles: {...entityStyles, [entityId]: newStyle}};
                }
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
            if (state.id === SELECTED_VARIABLE_LAYER_ID && isActiveView) {
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
    autoShowNewFigures: true,
    offlineMode: false,
    showSelectedVariableLayer: true,
    savedLayers: {},

    selectedDataStoreId: null,
    selectedDataSourceId: null,
    dataSourceFilterExpr: '',
    selectedOperationName: null,
    operationFilterTags: [],
    operationFilterExpr: '',

    showDataSourceDetails: true,
    showResourceDetails: true,
    showWorkflowStepDetails: true,
    showOperationDetails: true,
    showVariableDetails: true,
    showLayerDetails: true,

    panelContainerUndockedMode: false,
    leftPanelContainerLayout: {horPos: 300, verPos: 400},
    rightPanelContainerLayout: {horPos: 300, verPos: 400},
    selectedLeftTopPanelId: 'dataSources',
    selectedLeftBottomPanelId: 'operations',
    selectedRightTopPanelId: 'workspace',
    selectedRightBottomPanelId: 'variables',
    placemarkCollection: {
        type: 'FeatureCollection',
        features: []
    },
    selectedPlacemarkId: null,
    showPlacemarkDetails: true,
    placemarkCounter: 0,

    workspacePanelMode: 'steps',

    showDataSourceTitles: true,
    showLayerTextOverlay: true,
    debugWorldView: false,
    vectorStyleMode: "layer",

    backendConfig: {
        dataStoresPath: null,
        useWorkspaceImageryCache: false,
        resourceNamePattern: 'res_{index}',
    },
};


const PLACEMARK_TITLE_PREFIX = "Placemark ";

const sessionReducer = (state: SessionState = initialSessionState, action: Action) => {
    switch (action.type) {
        case actions.SET_SELECTED_ENTITY_ID: {
            const selectedEntityId = action.payload.selectedEntityId || null;
            let selectedPlacemarkId = null;
            if (isString(selectedEntityId) && selectedEntityId.startsWith('placemark-')) {
                selectedPlacemarkId = selectedEntityId;
            }
            if (selectedPlacemarkId !== state.selectedPlacemarkId) {
                return {...state, selectedPlacemarkId};
            }
            break;
        }
        case actions.UPDATE_INITIAL_STATE:
            return {...state, ...action.payload.session};
        case actions.UPDATE_SESSION_STATE:
            return {...state, ...action.payload};
        case actions.SET_SHOW_SELECTED_VARIABLE_LAYER:
            return {...state, ...action.payload};
        case actions.SAVE_LAYER: {
            const {key, layer} = action.payload;
            const savedLayers = updateObject(state.savedLayers, {[key]: layer});
            return {...state, savedLayers};
        }
        case actions.ADD_PLACEMARK: {
            const position = action.payload.position;
            const features = state.placemarkCollection.features.slice();
            const placemarkCounter = state.placemarkCounter;
            const letter = String.fromCharCode(65 + placemarkCounter % 26);
            const newPlacemark = {
                type: 'Feature',
                id: genPlacemarkId(),
                properties: {
                    title: PLACEMARK_TITLE_PREFIX + letter,
                    "marker-symbol": letter,
                    visible: true,
                },
                geometry: {
                    type: 'Point',
                    coordinates: position ? [position.longitude, position.latitude] : [0, 0]
                }
            } as Placemark;
            features.push(newPlacemark);
            const placemarkCollection = {...state.placemarkCollection, features};
            return {...state, placemarkCollection, placemarkCounter: placemarkCounter + 1, selectedPlacemarkId: newPlacemark.id};
        }
        case actions.REMOVE_PLACEMARK: {
            const placemarkId = action.payload.placemarkId;
            let features = state.placemarkCollection.features;
            const removedFeatureIndex = features.findIndex(f => f.id === placemarkId);
            if (removedFeatureIndex >= 0) {
                features = features.slice();
                features.splice(removedFeatureIndex, 1);
                let selectedPlacemarkId = null;
                if (removedFeatureIndex < features.length) {
                    selectedPlacemarkId = features[removedFeatureIndex].id;
                } else if (features.length > 0) {
                    selectedPlacemarkId = features[features.length - 1].id;
                }
                const placemarkCollection = {...state.placemarkCollection, features};
                return {...state, placemarkCollection, selectedPlacemarkId};
            }
            break;
        }
        case actions.UPDATE_PLACEMARK_GEOMETRY: {
            const {placemarkId, geometry} = action.payload;
            const features = state.placemarkCollection.features.slice();
            const featureIndex = features.findIndex(f => f.id === placemarkId);
            const oldFeature = featureIndex >= 0 && features[featureIndex];
            assert.ok(oldFeature);
            const oldGeometry = oldFeature && oldFeature.geometry;
            const newGeometry = {...oldGeometry, ...geometry};
            const newFeature = {...oldFeature, geometry: newGeometry};
            if (featureIndex >= 0) {
                features[featureIndex] = newFeature;
            } else {
                features.push(newFeature);
            }
            const placemarkCollection = {...state.placemarkCollection, features};
            return {...state, placemarkCollection};
        }
        case actions.UPDATE_PLACEMARK_PROPERTIES: {
            const {placemarkId, properties} = action.payload;
            const features = state.placemarkCollection.features.slice();
            const featureIndex = features.findIndex(f => f.id === placemarkId);
            const oldFeature = featureIndex >= 0 && features[featureIndex];
            assert.ok(oldFeature);
            const oldProperties = oldFeature && oldFeature.properties;
            const newProperties = {...oldProperties, ...properties};
            const oldTitle = oldProperties && oldProperties["title"];
            const newTitle = newProperties && newProperties["title"];
            if (newTitle && newTitle !== oldTitle) {
                // Update marker symbol as long as we don't have an editor for symbols
                let text;
                if (newTitle.startsWith(PLACEMARK_TITLE_PREFIX)) {
                    text = newTitle.substr(PLACEMARK_TITLE_PREFIX.length);
                } else {
                    text = newTitle;
                }
                let markerSymbol = newProperties["marker-symbol"];
                if (text.length > 0) {
                    markerSymbol = text[0];
                } else if (!markerSymbol) {
                    markerSymbol = "?";
                }
                newProperties["marker-symbol"] = markerSymbol;
            }
            const newFeature = {...oldFeature, properties: newProperties};
            if (featureIndex >= 0) {
                features[featureIndex] = newFeature;
            } else {
                features.push(newFeature);
            }
            const placemarkCollection = {...state.placemarkCollection, features};
            return {...state, placemarkCollection};
        }

    }
    return state;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// state.communication initial state and reducers

const initialCommunicationState: CommunicationState = {
    webAPIStatus: null,
    tasks: {}
};

const communicationReducer = (state: CommunicationState = initialCommunicationState, action: Action) => {
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
    globeMousePosition: null,
    globeViewPosition: null,
};

//noinspection JSUnusedLocalSymbols
const locationReducer = (state: LocationState = initialLocationState, action: Action) => {
    if (action.type === SET_GLOBE_MOUSE_POSITION) {
        const globeMousePosition = action.payload.position;
        return {...state, globeMousePosition};
    } else if (action.type === SET_GLOBE_VIEW_POSITION) {
        const globeViewPosition = action.payload.position;
        return {...state, globeViewPosition};
    }
    return state;
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Combined State reducer

export const stateReducer = combineReducers<State>({
                                                       data: dataReducer as Reducer<DataState>,
                                                       control: controlReducer as Reducer<ControlState>,
                                                       session: sessionReducer as Reducer<SessionState>,
                                                       communication: communicationReducer as Reducer<CommunicationState>,
                                                       location: locationReducer as Reducer<LocationState>,
                                                   });
