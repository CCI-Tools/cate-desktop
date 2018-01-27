import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Store, createStore, Middleware, applyMiddleware} from 'redux';
import {createLogger} from 'redux-logger';
import thunkMiddleware from 'redux-thunk';
import {Provider} from 'react-redux';
import {ipcRenderer} from 'electron';
import ApplicationPage from './containers/ApplicationPage'
import {newWebAPIClient} from './webapi'
import {State} from './state';
import * as actions from './actions'
import {stateReducer} from './reducers';


export function main() {
    const middlewares: Middleware[] = [thunkMiddleware];

    if (process.env.NODE_ENV === 'development') {
        const nonLoggedActionTypes = new Set([
                                                 // Too much noise:
                                                 actions.SET_GLOBE_MOUSE_POSITION,
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

    ipcRenderer.on('apply-initial-state', (event, initialState) => {
        store.dispatch(actions.updateInitialState(initialState));
        connectWebAPIClient(store);
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
}

function connectWebAPIClient(store: Store<State>) {
    store.dispatch(actions.setWebAPIStatus(null, 'connecting'));

    const webAPIConfig = store.getState().data.appConfig.webAPIConfig;
    console.log('webAPIConfig:', webAPIConfig);
    const webAPIClient = newWebAPIClient(webAPIConfig.apiWebSocketUrl);

    webAPIClient.onOpen = () => {
        store.dispatch(actions.setWebAPIStatus(webAPIClient, 'open'));
        store.dispatch(actions.loadBackendConfig());
        store.dispatch(actions.loadDataStores());
        store.dispatch(actions.loadOperations());
        store.dispatch(actions.loadInitialWorkspace());

        ReactDOM.render(
            <Provider store={store}>
                <ApplicationPage/>
            </Provider>,
            document.getElementById('container')
        );
    };

    webAPIClient.onClose = () => {
        store.dispatch(actions.setWebAPIStatus(null, 'closed'));
    };

    webAPIClient.onError = () => {
        store.dispatch(actions.setWebAPIStatus(webAPIClient, 'error'));
    };

    webAPIClient.onWarning = (event) => {
        console.warn(`cate-desktop: warning from cate-webapi: ${event.message}`);
    };
}



