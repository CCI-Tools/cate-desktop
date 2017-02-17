import {
    State, DataState, LocationState, SessionState, CommunicationState, ControlState, DataSourceState, DataStoreState
} from './state';
import * as actions from './actions';
import * as assert from "../common/assert";
import {combineReducers} from 'redux';
import {updateObject, updatePropertyObject} from "../common/objutil";


// TODO (forman/marcoz): write unit tests for reducers

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
    layers: [
        {
            id: 'selectedVariable',
            type: 'VariableImage',
            name: null,
            show: true
        }
    ],
    savedLayers: {},
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
            return updateObject(state, {
                appConfig: updateObject(state.appConfig, action.payload.appConfig)
            });
        case actions.SET_WEBAPI_STATUS: {
            const webAPIClient = action.payload.webAPIClient;
            return updateObject(state, {
                appConfig: updateObject(state.appConfig, {webAPIClient})
            });
        }
        case actions.UPDATE_DATA_STORES: {
            const dataStores = action.payload.dataStores.slice();
            return updateObject(state, {dataStores});
        }
        case actions.UPDATE_DATA_SOURCES: {
            return updateDataStores(state, action, dataStore => {
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
        case actions.UPDATE_OPERATIONS:
            return updateObject(state, {
                operations: action.payload.operations,
            });
        case actions.SET_CURRENT_WORKSPACE:
            return updateObject(state, {
                workspace: action.payload.workspace,
            });
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
        case actions.UPDATE_LAYER: {
            const layer = action.payload.layer;
            const layers = state.layers.slice();
            const layerIndex = layers.findIndex(l => l.id === layer.id);
            assert.ok(layerIndex >= 0, "layerIndex >= 0");
            layers[layerIndex] = updateObject(layers[layerIndex], layer);
            return updateObject(state, {layers});
        }
        case actions.UPDATE_COLOR_MAPS: {
            return updateObject(state, action.payload);
        }
        case actions.SAVE_LAYER: {
            const key = action.payload.key;
            const layer = action.payload.layer;
            const savedLayers = updateObject(state.savedLayers, {[key]: updateObject(layer, {})});
            return updateObject(state, {savedLayers});
        }
    }
    return state;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// state.control initial state and reducers


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
    selectedColorMapName: null,
    showVariableDetails: true,
    selectedLayerId: null,
    showLayerDetails: true,
    dialogs: {}
};

const controlReducer = (state: ControlState = initialControlState, action) => {
    switch (action.type) {
        case actions.UPDATE_DATA_SOURCES: {
            const dataSources = action.payload.dataSources;
            return updateObject(state, {
                selectedDataSourceId: (dataSources && dataSources.length) ? dataSources[0].id : null
            });
        }
        case actions.UPDATE_OPERATIONS: {
            const operations = action.payload.operations;
            return updateObject(state, {
                selectedOperationName: (operations && operations.length) ? operations[0].name : null
            });
        }
        case actions.SET_SELECTED_DATA_STORE_ID:
        case actions.SET_SELECTED_DATA_SOURCE_ID:
        case actions.SET_DATA_SOURCE_FILTER_EXPR:
        case actions.SET_SELECTED_OPERATION_NAME:
        case actions.SET_OPERATION_FILTER_TAGS:
        case actions.SET_OPERATION_FILTER_EXPR:
        case actions.SET_SELECTED_VARIABLE_NAME:
        case actions.SET_SELECTED_WORKSPACE_RESOURCE_ID:
        case actions.SET_SELECTED_WORKFLOW_STEP_ID:
        case actions.SET_SELECTED_LAYER_ID:
        case actions.SET_SELECTED_COLOR_MAP_NAME:
        case actions.UPDATE_CONTROL_STATE:
            return updateObject(state, action.payload);
        case actions.UPDATE_DIALOG_STATE:
            return updateObject(state, {
                dialogs: updatePropertyObject(state.dialogs, action.payload.dialogId, action.payload.dialogState)
            });
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
        case actions.SET_TASK_STATE:
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
