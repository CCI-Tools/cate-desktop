import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Store, createStore, applyMiddleware} from 'redux';
import * as loggerMiddleware from 'redux-logger';
import thunkMiddleware from 'redux-thunk';
import {Provider} from 'react-redux';
import {ipcRenderer} from 'electron';
import {ApplicationPage} from './containers/ApplicationPage'
import {newWebAPIClient, WebSocketMock, WebAPIServiceMock} from './webapi'
import {State} from './state';
import * as actions from './actions'
import {stateReducer} from './reducers';


export function main() {

    const middleware = applyMiddleware(
        thunkMiddleware,
        loggerMiddleware({level: 'info', collapsed: true, diff: true})
    );

    const store = createStore(stateReducer, middleware);

    ipcRenderer.on('apply-initial-state', (event, initialState) => {
        store.dispatch(actions.applyInitialState(initialState));
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
}

function connectWebAPIClient(store: Store<State>) {
    store.dispatch(actions.setWebAPIStatus(null, 'connecting'));

    const webAPIConfig = store.getState().data.appConfig.webAPIConfig;
    console.log('webAPIConfig:', webAPIConfig);
    let webAPIClient;
    if (!webAPIConfig.useMockService && webAPIConfig.webSocketUrl) {
        webAPIClient = newWebAPIClient(webAPIConfig.webSocketUrl);
    } else {
        webAPIClient = newWebAPIClient('ws://mock', 0, new WebSocketMock(100, new WebAPIServiceMock(), true));
    }

    webAPIClient.onOpen = () => {
        store.dispatch(actions.setWebAPIStatus(webAPIClient, 'open'));
        store.dispatch(actions.loadBackendConfig());
        store.dispatch(actions.loadInitialWorkspace());
        store.dispatch(actions.loadDataStores());
        store.dispatch(actions.loadOperations());


        // This is a test, we keep it as a test an a code template for code that need to run later
        store.dispatch(dispatch => {
            setTimeout(() => {
                dispatch({type: 'BRING_KINDERSCHOKOLADE', payload: 'Here are 5kg Kinderschokolade'});
            }, 5000);
        });

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


