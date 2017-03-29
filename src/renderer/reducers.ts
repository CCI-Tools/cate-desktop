import {
    State, DataState, LocationState, SessionState, CommunicationState, ControlState, DataStoreState, ViewerState
} from './state';
import * as actions from './actions';
import * as assert from "../common/assert";
import {combineReducers} from 'redux';
import {updateObject, updatePropertyObject} from "../common/objutil";

// Note: reducers are unit-tested through actions.spec.ts

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// state.data initial state and reducers

const initialDataState: DataState = {
    appConfig: {
        webAPIClient: null,
        webAPIConfig: {
            servicePort: -1,
            serviceAddress: '',
            restUrl: '',
            webSocketUrl: '',
        }
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
            return updateObject(state, {workspace});
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


let initialViewerState = {
    viewMode: "3D",
    projectionCode: 'EPSG:4326',
    layers: [
        {
            id: actions.SELECTED_VARIABLE_LAYER_ID,
            type: 'Unknown',
            visible: true,
        },
        {
            id: actions.COUNTRIES_LAYER_ID,
            name: 'Countries',
            type: 'Vector',
            visible: false,
        }
    ],
} as ViewerState;


const initialControlState: ControlState = {
    selectedDataStoreId: null,
    selectedDataSourceId: null,
    dataSourceFilterExpr: '',
    selectedOperationName: null,
    showDataSourceDetails: true,
    operationFilterTags: [],
    operationFilterExpr: '',
    showOperationDetails: true,
    selectedWorkflowStepId: null,
    selectedWorkspaceResourceId: null,
    selectedVariableName: null,
    showVariableDetails: true,
    selectedLayerId: null,
    showLayerDetails: true,
    panelContainerUndockedMode: false,
    leftPanelContainerLayout: {horPos: 300, verPos: 600},
    rightPanelContainerLayout: {horPos: 300, verPos: 300},
    selectedLeftTopPanelId: 'dataSources',
    selectedLeftBottomPanelId: 'workspace',
    selectedRightTopPanelId: 'variables',
    selectedRightBottomPanelId: 'layers',
    viewer: initialViewerState,
    savedLayers: {},
    dialogs: {}
};


const controlReducer = (state: ControlState = initialControlState, action) => {
    switch (action.type) {
        case actions.UPDATE_DATA_SOURCES: {
            const dataSources = action.payload.dataSources;
            const selectedDataSourceId = (dataSources && dataSources.length) ? dataSources[0].id : null;
            state = updateObject(state, {selectedDataSourceId});
            break;
        }
        case actions.UPDATE_OPERATIONS: {
            const operations = action.payload.operations;
            const selectedOperationName = (operations && operations.length) ? operations[0].name : null;
            state = updateObject(state, {selectedOperationName});
            break;
        }
        case actions.SAVE_LAYER: {
            const key = action.payload.key;
            const layer = action.payload.layer;
            const savedLayers = updateObject(state.savedLayers, {[key]: updateObject(layer, {})});
            state = updateObject(state, {savedLayers});
            break;
        }
        case actions.UPDATE_CONTROL_STATE:
            state = updateObject(state, action.payload);
            break;
        case actions.UPDATE_DIALOG_STATE: {
            const dialogs = updatePropertyObject(state.dialogs, action.payload.dialogId, action.payload.dialogState);
            state = updateObject(state, {dialogs});
            break;
        }
        case actions.RENAME_RESOURCE: {
            const resName = action.payload.resName;
            const newResName = action.payload.newResName;
            if (state.selectedWorkspaceResourceId === resName) {
                state = updateObject(state, {selectedWorkspaceResourceId: newResName});
            }
            break;
        }
    }

    const viewer = viewerReducer(state.viewer, action);
    if (viewer !== state.viewer) {
        state = updateObject(state, {viewer});
    }

    return state;
};


const viewerReducer = (state: ViewerState, action) => {
    switch (action.type) {
        case actions.SET_VIEW_MODE: {
            const viewMode = action.payload.viewMode;
            return updateObject(state, {viewMode});
        }
        case actions.SET_PROJECTION_CODE: {
            const projectionCode = action.payload.projectionCode;
            return updateObject(state, {projectionCode});
        }
        case actions.ADD_LAYER: {
            const layer = action.payload.layer;
            const layers = state.layers.slice();
            layers.push(updateObject(layer));
            return updateObject(state, {layers});
        }
        case actions.REMOVE_LAYER: {
            const layerId = action.payload.id;
            const layers = state.layers.slice();
            const layerIndex = layers.findIndex(l => l.id === layerId);
            if (layerIndex >= 0) {
                layers.splice(layerIndex, 1);
                return updateObject(state, {layers});
            }
            return state;
        }
        case actions.MOVE_LAYER_UP: {
            const layerId = action.payload.id;
            const layers = state.layers.slice();
            const layerIndex = layers.findIndex(l => l.id === layerId);
            assert.ok(layerIndex >= 0, "layerIndex >= 0");
            if (layerIndex > 0) {
                const temp = layers[layerIndex - 1];
                layers[layerIndex - 1] = layers[layerIndex];
                layers[layerIndex] = temp;
                return updateObject(state, {layers});
            }
            return state;
        }
        case actions.MOVE_LAYER_DOWN: {
            const layerId = action.payload.id;
            const layers = state.layers.slice();
            const layerIndex = layers.findIndex(l => l.id === layerId);
            assert.ok(layerIndex >= 0, "layerIndex >= 0");
            if (layerIndex >= 0 && layerIndex < layers.length - 1) {
                const temp = layers[layerIndex + 1];
                layers[layerIndex + 1] = layers[layerIndex];
                layers[layerIndex] = temp;
                return updateObject(state, {layers});
            }
            return state;
        }
        case actions.UPDATE_LAYER: {
            const layer = action.payload.layer;
            const layers = state.layers.slice();
            const layerIndex = layers.findIndex(l => l.id === layer.id);
            assert.ok(layerIndex >= 0, "layerIndex >= 0");
            layers[layerIndex] = updateObject(layers[layerIndex], layer);
            return updateObject(state, {layers});
        }
        case actions.REPLACE_LAYER: {
            const layer = action.payload.layer;
            const layers = state.layers.slice();
            const layerIndex = layers.findIndex(l => l.id === layer.id);
            assert.ok(layerIndex >= 0, "layerIndex >= 0");
            layers[layerIndex] = updateObject(layer);
            return updateObject(state, {layers});
        }
        case actions.RENAME_RESOURCE: {
            const resName = action.payload.resName;
            const newResName = action.payload.newResName;
            let layers;
            for (let i = 0; i < state.layers.length; i++) {
                const layer = state.layers[i];
                if ((layer as any).resName == resName) {
                    if (!layers) {
                        layers = state.layers.slice();
                    }
                    layers[i] = updateObject(layer, {resName: newResName});
                }
            }
            if (layers) {
                return updateObject(state, {layers});
            }
            return state;
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
    backendConfig: {
        dataStoresPath: null,
        useWorkspaceImageryCache: false,
    }
};

const sessionReducer = (state: SessionState = initialSessionState, action) => {
    switch (action.type) {
        case actions.UPDATE_INITIAL_STATE:
            return updateObject(state, action.payload.session);
        case actions.UPDATE_SESSION_STATE:
            return updateObject(state, action.payload);
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
