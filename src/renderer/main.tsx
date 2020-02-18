import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Store, createStore, Middleware, applyMiddleware, Dispatch } from 'redux';
import { createLogger } from 'redux-logger';
import thunkMiddleware from 'redux-thunk';
import { Provider } from 'react-redux';
import { ipcRenderer } from 'electron';
import ApplicationPage from './containers/ApplicationPage'
import { State } from './state';
import * as actions from './actions'
import { stateReducer } from './reducers';


export function main() {
    const middlewares: Middleware[] = [thunkMiddleware];

    if (process.env.NODE_ENV === 'development') {
        const nonLoggedActionTypes = new Set([
                                                 // Too much noise:
                                                 actions.SET_GLOBE_MOUSE_POSITION,
                                                 actions.SET_GLOBE_VIEW_POSITION,
                                                 actions.SET_GLOBE_VIEW_POSITION,
                                                 actions.UPDATE_MOUSE_IDLE_STATE,
                                                 actions.SET_USER_CREDENTIALS,
                                             ]);
        const loggerOptions = {
            level: 'info',
            collapsed: true,
            diff: true,
            predicate: (getState, action) => !nonLoggedActionTypes.has(action.type)
        };
        middlewares.push(createLogger(loggerOptions));
    }

    const middleware = applyMiddleware(...middlewares);
    const store = createStore(stateReducer, middleware) as Store<State>;

    ReactDOM.render(
        <Provider store={store}>
            <ApplicationPage/>
        </Provider>,
        document.getElementById('container')
    );

    ipcRenderer.on('apply-initial-state', (event, initialState) => {
        store.dispatch(actions.updateInitialState(initialState));
    });

    ipcRenderer.on('new-workspace', () => {
        store.dispatch(actions.newWorkspaceInteractive());
    });

    ipcRenderer.on('open-workspace', () => {
        store.dispatch(actions.openWorkspaceInteractive());
    });

    ipcRenderer.on('close-workspace', () => {
        store.dispatch(actions.closeWorkspaceInteractive());
    });

    ipcRenderer.on('delete-workspace', () => {
        store.dispatch(actions.deleteWorkspaceInteractive());
    });

    ipcRenderer.on('save-workspace', () => {
        store.dispatch(actions.saveWorkspaceInteractive());
    });

    ipcRenderer.on('save-workspace-as', () => {
        store.dispatch(actions.saveWorkspaceAsInteractive());
    });

    ipcRenderer.on('show-preferences-dialog', () => {
        store.dispatch(actions.showPreferencesDialog());
    });

    ipcRenderer.on('get-preferences', () => {
        store.dispatch(actions.sendPreferencesToMain());
    });

    ipcRenderer.on('set-preferences', (event, preferences) => {
        store.dispatch(actions.updatePreferences(preferences, false));
    });

    document.addEventListener('drop', function (event: any) {
        event.preventDefault();
        event.stopPropagation();
        for (let file of event.dataTransfer.files) {
            readDroppedFile(file, store.dispatch);
        }
    });

    document.addEventListener('dragover', function (event: any) {
        event.preventDefault();
        event.stopPropagation();
    });
}

function readDroppedFile(file: File, dispatch: Dispatch<State>) {
    let opName, opArgs;
    if (file.path.endsWith('.nc')) {
        opName = 'read_netcdf';
        // opArgs = {file: {value: file.path}, normalize: {value: false}}
    } else if (file.path.endsWith('.txt')) {
        opName = 'read_text';
    } else if (file.path.endsWith('.json')) {
        opName = 'read_json';
    } else if (file.path.endsWith('.csv')) {
        opName = 'read_csv';
    } else if (file.path.endsWith('.geojson') || file.path.endsWith('.shp') || file.path.endsWith('.gml')) {
        opName = 'read_geo_data_frame';
    }
    if (!opArgs) {
        opArgs = {file: {value: file.path}};
    }
    if (opName) {
        dispatch(actions.setWorkspaceResource(opName,
                                              opArgs,
                                              null,
                                              false,
                                              `Reading dropped file ${file.path}`));
    } else {
        console.warn('Dropped file of unrecognized type: ', file.path);
    }
}

