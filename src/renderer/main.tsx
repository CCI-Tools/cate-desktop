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

export interface FileFilter {
    name: string;
    extensions: string[];
}

type FileDialogProperty = 'openFile'|'openDirectory'|'multiSelections'|'createDirectory'|'showHiddenFiles';

export interface SaveDialogOptions {
    title?: string;
    defaultPath?: string;
    /**
     * Custom label for the confirmation button, when left empty the default label will be used.
     */
    buttonLabel?: string;
    filters?: FileFilter[];
}

export interface OpenDialogOptions extends SaveDialogOptions {
    /**
     * Contains which features the dialog should use.
     */
    properties?: FileDialogProperty[];
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

function showOpenDialog(openDialogOptions: OpenDialogOptions) {
    const workspacePaths = ipcRenderer.sendSync('show-open-dialog', true, openDialogOptions);
    return workspacePaths && workspacePaths.length ? workspacePaths[0] : null;
}

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
        const workspacePath = showOpenDialog({
            title: "New Workspace",
            buttonLabel: "Select",
            properties: ['openDirectory', 'createDirectory'],
        } as OpenDialogOptions);
        if (workspacePath) {
            store.dispatch(actions.newWorkspace(workspacePath));
        }
    });

    ipcRenderer.on('open-workspace', () => {
        const workspacePath = showOpenDialog({
            title: "Open Workspace",
            buttonLabel: "Open",
            properties: ['openDirectory'],
        } as OpenDialogOptions);
        if (workspacePath) {
            store.dispatch(actions.openWorkspace(workspacePath));
        }
    });

    ipcRenderer.on('close-workspace', () => {
        store.dispatch(actions.closeWorkspace())
    });

    ipcRenderer.on('save-workspace', () => {
        if (store.getState().data.workspace.isScratch) {
            saveWorkspaceAs();
        } else {
            store.dispatch(actions.saveWorkspace())
        }
    });

    let saveWorkspaceAs = function () {
        const workspacePath = showOpenDialog({
            title: "Save Workspace As",
            buttonLabel: "Select",
            properties: ['openDirectory', 'createDirectory'],
        } as OpenDialogOptions);
        if (workspacePath) {
            store.dispatch(actions.saveWorkspaceAs(workspacePath))
        }
    };
    ipcRenderer.on('save-workspace-as', saveWorkspaceAs);
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

    // TODO (forman): this code can take considerable time and is executed BEFORE the window UI shows up
    //                we urgently need to display some progress indicator beforehand.
    webAPIClient.onOpen = () => {
        store.dispatch(actions.setWebAPIStatus(webAPIClient, 'open'));
        store.dispatch(actions.loadInitialWorkspace());
        store.dispatch(actions.loadDataStores());
        // TODO (forman): store.dispatch(actions.loadOperations());


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
