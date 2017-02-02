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

/**
 * See dialog.showSaveDialog() in https://github.com/electron/electron/blob/master/docs/api/dialog.md
 */
export interface SaveDialogOptions {
    title?: string;
    defaultPath?: string;
    /**
     * Custom label for the confirmation button, when left empty the default label will be used.
     */
    buttonLabel?: string;
    filters?: FileFilter[];
}

/**
 * See dialog.showOpenDialog() in https://github.com/electron/electron/blob/master/docs/api/dialog.md
 */
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
    buttons: string[];

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
}

function showOpenDialog(openDialogOptions: OpenDialogOptions) {
    const workspacePaths = ipcRenderer.sendSync('show-open-dialog', openDialogOptions, true);
    return workspacePaths && workspacePaths.length ? workspacePaths[0] : null;
}

function showMessageBox(messageBoxOptions: MessageBoxOptions) {
    return ipcRenderer.sendSync('show-message-box', messageBoxOptions, true);
}

export function main() {

    const middleware = applyMiddleware(
        thunkMiddleware,
        loggerMiddleware({level: 'info', collapsed: true, diff: true})
    );

    const store = createStore(stateReducer, middleware);

    const saveWorkspaceAs = function () {
        const workspacePath = showOpenDialog({
            title: "Save Workspace As",
            buttonLabel: "Select",
            properties: ['openDirectory', 'createDirectory'],
        } as OpenDialogOptions);
        if (workspacePath) {
            store.dispatch(actions.saveWorkspaceAs(workspacePath))
        }
    };

    const maybeSaveWorkspace = function (title: string, message: string, detail?: string): boolean {
        const workspace = store.getState().data.workspace;
        const maySave = workspace.workflow.steps.length && (workspace.isModified || !workspace.isSaved);
        if (maySave) {
            const answer = showMessageBox({
                title,
                message,
                detail,
                buttons: ["Yes", "No", "Cancel"],
                defaultId: 0,
                cancelId: 2,
            });
            if (answer == 0) {
                if (workspace.isScratch) {
                    saveWorkspaceAs();
                } else {
                    store.dispatch(actions.saveWorkspace());
                }
            } else if (answer === 2) {
                return false;
            }
        }
        return true;
    };

    ipcRenderer.on('apply-initial-state', (event, initialState) => {
        store.dispatch(actions.applyInitialState(initialState));
        connectWebAPIClient(store);
    });

    ipcRenderer.on('new-workspace', () => {
        const workspacePath = showOpenDialog({
            title: "New Workspace",
            buttonLabel: "Select",
            properties: ['openDirectory', 'createDirectory'],
        });
        if (workspacePath) {
            const ok = maybeSaveWorkspace(
                "Cate - New Workspace",
                "Would you like to save the current workspace before creating a new one?",
                "Press \"Cancel\" to cancel creating a new workspace."
            );
            if (ok) {
                store.dispatch(actions.newWorkspace(workspacePath));
            }
        }
    });

    ipcRenderer.on('open-workspace', () => {
        const workspacePath = showOpenDialog({
            title: "Open Workspace",
            buttonLabel: "Open",
            properties: ['openDirectory'],
        });
        if (workspacePath) {
            const ok = maybeSaveWorkspace(
                "Cate - Open Workspace",
                "Would you like to save the current workspace before opening the new one?",
                "Press \"Cancel\" to cancel opening a new workspace."
            );
            if (ok) {
                store.dispatch(actions.openWorkspace(workspacePath));
            }
        }
    });

    ipcRenderer.on('close-workspace', () => {
        const ok = maybeSaveWorkspace(
            "Cate - Close Workspace",
            "Would you like to save the current workspace before closing it?",
            "Press \"Cancel\" to cancel closing the workspace."
        );
        if (ok) {
            store.dispatch(actions.closeWorkspace())
        }
    });

    ipcRenderer.on('save-workspace', () => {
        const workspace = store.getState().data.workspace;
        if (workspace.isScratch) {
            saveWorkspaceAs();
        } else {
            store.dispatch(actions.saveWorkspace())
        }
    });

    ipcRenderer.on('save-workspace-as', saveWorkspaceAs);

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
