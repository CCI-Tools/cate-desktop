import * as electron from 'electron';
import { getAppDataDir, getAppIconPath, CATE_WEBAPI_VERSION_RANGE, getCateDir, getWebAPIRestUrl } from './appenv';
import { Configuration } from './configuration';


function ifDarwinOrElse(darwinValue, elseValue) {
    if (process.platform === 'darwin')
        return darwinValue;
    else
        return elseValue;
}

function performRendererAction(focusedWindow, action: string, ...args) {
    if (focusedWindow) {
        focusedWindow.webContents.send(action, ...args);
    }
}

export function getActions(configuration: Configuration) {

    const isUserLoggedIn = configuration.get('webAPIMode') === 'remote'
                           && !!configuration.get('user');

    //noinspection JSUnusedLocalSymbols
    return {

        /* app (Darwin only ) ###########################################################*/

        about: {
            role: 'about',
            category: 'app',
        },

        services: {
            role: 'services',
            category: 'app',
            submenu: []
        },

        hide: {
            role: 'hide',
            category: 'app',
        },

        hideOthers: {
            role: 'hideothers',
            category: 'app',
        },

        unhide: {
            role: 'unhide',
            category: 'app',
        },

        quit: {
            label: 'Quit ' + electron.app.getName(),
            accelerator: 'Command+Q',
            click: function () {
                electron.app.quit();
            },
            category: 'app',
        },

        /* file ###########################################################*/

        newWorkspace: {
            label: 'New Workspace',
            category: 'file',
            click: (item, focusedWindow) => performRendererAction(focusedWindow, 'new-workspace'),
        },

        openWorkspace: {
            label: 'Open Workspace',
            category: 'file',
            click: (item, focusedWindow) => performRendererAction(focusedWindow, 'open-workspace'),
        },

        closeWorkspace: {
            label: 'Close Workspace',
            category: 'file',
            click: (item, focusedWindow) => performRendererAction(focusedWindow, 'close-workspace'),
        },

        deleteWorkspace: {
            label: 'Delete Workspace',
            category: 'file',
            click: (item, focusedWindow) => performRendererAction(focusedWindow, 'delete-workspace'),
        },

        saveWorkspace: {
            label: 'Save Workspace',
            category: 'file',
            click: (item, focusedWindow) => performRendererAction(focusedWindow, 'save-workspace'),
        },

        saveWorkspaceAs: {
            label: 'Save Workspace As...',
            category: 'file',
            click: (item, focusedWindow) => performRendererAction(focusedWindow, 'save-workspace-as'),
        },

        /* ---------------------------------- */

        preferences: {
            label: 'Preferences...',
            accelerator: ifDarwinOrElse('Command+,', null),
            category: 'file',
            click: (item, focusedWindow) => performRendererAction(focusedWindow, 'show-preferences-dialog'),
        },

        /* ---------------------------------- */

        logout: {
            label: 'Logout',
            click: (item, focusedWindow) => performRendererAction(focusedWindow, 'logout'),
            category: 'file',
            enabled: !!isUserLoggedIn
        },

        exit: {
            label: 'Exit',
            click: function () {
                electron.app.quit();
            },
            category: 'file',
        },

        /* edit ###########################################################*/

        undo: {
            role: 'undo',
            category: 'edit',
        },

        redo: {
            role: 'redo',
            category: 'edit',
        },

        cut: {
            role: 'cut',
            category: 'edit',
        },

        copy: {
            role: 'copy',
            category: 'edit',
        },

        paste: {
            role: 'paste',
            category: 'edit',
        },

        pasteAndMatchStyle: {
            role: 'pasteandmatchstyle',
            category: 'edit',
        },

        deleteSel: {
            role: 'delete',
            category: 'edit',
        },

        /* ---------------------------------- */

        /* Darwin only */
        startSpeaking: {
            role: 'startspeaking',
            category: 'edit',
        },

        /* Darwin only */
        stopSpeaking: {
            role: 'stopspeaking',
            category: 'edit',
        },

        /* ---------------------------------- */

        selectAll: {
            role: 'selectall',
            category: 'edit',
        },

        /* view ###########################################################*/

        reload: {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click(_item, focusedWindow) {
                if (focusedWindow) focusedWindow.reload()
            }
        },


        toggleDevTools: {
            label: 'Toggle Developer Tools',
            accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
            click(_item, focusedWindow) {
                if (focusedWindow) focusedWindow.webContents.toggleDevTools()
            },
            category: 'tools',
        },

        resetPageZoom: {
            role: 'resetzoom',
            category: 'view',
        },

        zoomInPage: {
            role: 'zoomin',
            category: 'view',
        },

        zoomOutPage: {
            role: 'zoomout',
            category: 'view',
        },

        toggleFullScreen: {
            role: 'togglefullscreen',
            category: 'view',
        },

        /* window ###########################################################*/

        minimize: {
            role: 'minimize',
            category: 'window',
        },

        close: {
            role: 'close',
            category: 'window',
        },

        /* Darwin only */
        zoom: {
            role: 'zoom',
            category: 'window',
        },

        /* Darwin only */
        front: {
            role: 'front',
            category: 'window',
        },

        /* help #############################################################*/

        openWebsite: {
            label: 'Website',
            click: function () {
                electron.shell.openExternal('https://climatetoolbox.io/').then(() => true)
            },
            category: 'help',
        },

        openDocumentation: {
            label: 'Documentation',
            click: function () {
                electron.shell.openExternal('http://cate.readthedocs.io/en/latest/').then(() => true)
            },
            category: 'help',
        },

        openIssueTracker: {
            label: 'Issue Tracker',
            click: function () {
                electron.shell.openExternal('https://github.com/CCI-Tools/cate/issues').then(() => true)
            },
            category: 'help',
        },

        openDownloads: {
            label: 'Downloads',
            click: function () {
                electron.shell.openExternal('https://github.com/CCI-Tools/cate/releases').then(() => true)
            },
            category: 'help',
        },

        openEsaCCI: {
            label: 'ESA Climate Change Initiative',
            click: function () {
                electron.shell.openExternal('http://cci.esa.int/').then(() => true)
            },
            category: 'help',
        },

        checkForUpdates: {
            label: 'Check for Updates...',
            click: function () {
                // TODO (nf): check how this may be implemented later
                // const app: any = electron.app;
                // app.checkForUpdates();
            },
            category: 'help',
        },

        openAboutWindow: {
            label: 'About ' + electron.app.getName(),
            role: 'about',
            category: 'help',
            click: () => {
                const title = `About ${electron.app.getName()}`;
                const message = `${electron.app.getName()}, version ${electron.app.getVersion()}`;
                const webAPIConfig = configuration.get('webAPIConfig') || {protocol: 'http', serviceAddress: 'unknown.com'};
                const user = configuration.get('user') || {name: process.env["USER"]};
                const detail = '' +
                               `Program: ${electron.app.getAppPath()}\n` +
                               `User: ${user.name}\n` +
                               `Data folder: ${getAppDataDir()}\n` +
                               `Web API: ${getWebAPIRestUrl(webAPIConfig)}\n` +
                               `CLI env: ${getCateDir() ? getCateDir() : '<unknown>'}\n` +
                               `Requires Cate Core ${CATE_WEBAPI_VERSION_RANGE}\n` +
                               '\n' +
                               'Cate is open source software distributed under the MIT license.\n\n' +
                               'Cate is developed on top of numerous 3rd party software packages.\n' +
                               'Notably, the Cate project team would like to acknowledge following projects:\n' +
                               'Python, Conda, Xarray, Dask, Pandas, Numpy, Matplotlib, Tornado, and more for Cate Core;\n' +
                               'TypeScript, Electron, React, Redux, BlueprintJS, Cesium, and more for Cate Desktop.';
                const icon = electron.nativeImage.createFromPath(getAppIconPath());
                electron.dialog.showMessageBox({title, message, detail, icon}).then(() => true);
            },
        },
    };
}
