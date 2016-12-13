import {State, DataState, LocationState, SessionState, CommunicationState, ControlState} from './state';
import * as actions from './actions';
import {combineReducers} from 'redux';

// TODO write tests for reducers



// TODO move updateObject() into obj.ts, see also src/common/assign.ts
/**
 * Encapsulate the idea of passing a new object as the first parameter
 * to Object.assign to ensure we correctly copy data instead of mutating.
 */
export function updateObject(oldObject, newValues) {
    return Object.assign({}, oldObject, newValues);
}

// TODO move updateProperty() into obj.ts, see also src/common/assign.ts
export function updateProperty(oldObject: Object, key: string, value: any) {
    const newValues = {};
    newValues[key] = updateObject(oldObject[key], value);
    return updateObject(oldObject, newValues);
}

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
    workspace: null
};

const dataReducer = (state: DataState = initialDataState, action) => {
    switch (action.type) {
        case actions.APPLY_INITIAL_STATE:
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
            const dataStoreId = action.payload.dataStoreId;
            const dataStoreIndex = state.dataStores.findIndex(dataStore => dataStore.id === dataStoreId);
            if (dataStoreIndex < 0) {
                throw Error('illegal data store ID: ' + dataStoreId);
            }
            const oldDataStore = state.dataStores[dataStoreIndex];
            const newDataSources = action.payload.dataSources.slice();
            const newDataStore = updateObject(oldDataStore, {
                dataSources: newDataSources,
            });
            const newDataStores = state.dataStores.slice();
            newDataStores[dataStoreIndex] = newDataStore;
            return updateObject(state, {
                dataStores: newDataStores
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
    }
    return state;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// state.control initial state and reducers


const initialControlState: ControlState = {
    selectedDataStoreId: null,
    selectedDataSourceId: null,
    selectedOperationName: null,
    operationFilterTags: [],
    operationFilterExpr: '',
    selectedWorkflowStepId: null,
    selectedWorkspaceResourceId: null,
    dialogs: {
        openDataset: {}
    },
    activities: []
    //     [
    //     {jobId: 1, title: "open ds_0", progress: 0.3, messages : ["syncing 2002", "syncing 2003"]},
    //     {jobId: 2, title: "open ds_1", progress: 0.8},
    //     {jobId: 3, title: "open ds_2"},
    //     {jobId: 4, title: "open ds_3", progress: 0.1},
    //     {jobId: 5, title: "open ds_4",  messages : [ "I/O error"] }
    // ]

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
        case actions.SET_SELECTED_OPERATION_NAME:
        case actions.SET_OPERATION_FILTER_TAGS:
        case actions.SET_OPERATION_FILTER_EXPR:
        case actions.SET_SELECTED_WORKSPACE_RESOURCE_ID:
        case actions.SET_SELECTED_WORKFLOW_STEP_ID:
            return updateObject(state, action.payload);
        case actions.SET_DIALOG_STATE:
            return updateObject(state, {
                dialogs: updateProperty(state.dialogs, action.payload.dialogId, action.payload.dialogState)
            });
        case actions.UPDATE_ACTIVITY:
            const newActivity = action.payload.activity;
            const activityIndex = state.activities.findIndex(activity => activity.jobId === newActivity.jobId);
            if (activityIndex < 0) {
                // new activity
                const newActivities = state.activities.slice();
                newActivities.push(newActivity);
                return updateObject(state, {
                    activities: newActivities,
                });
            } else {
                // update activity
                const ativitiesCopy = state.activities.slice();
                const oldActivity = state.activities[activityIndex];
                ativitiesCopy[activityIndex] = updateObject(oldActivity, newActivity);
                const oldMsgs = oldActivity.messages;
                if (oldMsgs && newActivity.messages) {
                    const newMessages = oldMsgs.slice();
                    newMessages.push(...newActivity.messages)
                    ativitiesCopy[activityIndex].messages = newMessages;
                }
                return updateObject(state, {activities: ativitiesCopy});
            }
    }
    return state;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// state.session initial state and reducers

const initialSessionState: SessionState = {
    openLastWorkspace: false,
    lastWorkspacePath: null,
};

const sessionReducer = (state: SessionState = initialSessionState, action) => {
    switch (action.type) {
        case actions.APPLY_INITIAL_STATE:
            return updateObject(state, action.payload.session);
        case actions.SET_CURRENT_WORKSPACE:
            if (!action.payload.workspace.isScratch) {
                return updateObject(state, {
                    lastWorkspacePath: action.payload.workspace.isScratch ? null : action.payload.workspace.path,
                });
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

const communicationReducer = (state: CommunicationState = initialCommunicationState, action) => {
    switch (action.type) {
        case actions.SET_WEBAPI_STATUS:
            return updateObject(state, {webAPIStatus: action.payload.webAPIStatus});
        case actions.SET_TASK_STATE:
            return updateObject(state, {
                tasks: updateProperty(state.tasks, action.payload.taskId, action.payload.taskState)
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
