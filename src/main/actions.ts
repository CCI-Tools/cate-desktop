import * as electron from 'electron';
import {getAppDataDir, getAppIconPath} from "./appenv";

const app = electron.app;

function ifDarwinOrElse(darwinValue, elseValue) {
    if (process.platform == 'darwin')
        return darwinValue;
    else
        return elseValue;
}

function performRendererAction(focusedWindow, action, ...args) {
    if (focusedWindow) {
        focusedWindow.webContents.send(action, ...args);
    }
}

//noinspection JSUnusedLocalSymbols
export const actions = {

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
        category: "file",
        click: (item, focusedWindow) => performRendererAction(focusedWindow, 'new-workspace'),
    },

    openWorkspace: {
        label: 'Open Workspace',
        category: "file",
        click: (item, focusedWindow) => performRendererAction(focusedWindow, 'open-workspace'),
    },

    closeWorkspace: {
        label: 'Close Workspace',
        category: "file",
        click: (item, focusedWindow) => performRendererAction(focusedWindow, 'close-workspace'),
    },

    saveWorkspace: {
        label: 'Save Workspace',
        category: "file",
        click: (item, focusedWindow) => performRendererAction(focusedWindow, 'save-workspace'),
    },

    saveWorkspaceAs: {
        label: 'Save Workspace As...',
        category: "file",
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
        click (_item, focusedWindow) {
            if (focusedWindow) focusedWindow.reload()
        }
    },


    toggleDevTools: {
        label: 'Toggle Developer Tools',
        accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
        click (_item, focusedWindow) {
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

    openDocumentation: {
        label: 'Documentation',
        click: function () {
            electron.shell.openExternal('http://ect-core.readthedocs.io/en/latest/')
        },
        category: 'help',
    },

    openIssueTracker: {
        label: 'Issue Tracker',
        click: function () {
            electron.shell.openExternal('https://github.com/CCI-Tools/cate-core/issues')
        },
        category: 'help',
    },

    openEsaCCI: {
        label: 'ESA Climate Change Initiative',
        click: function () {
            electron.shell.openExternal('http://cci.esa.int/')
        },
        category: 'help',
    },

    openAboutWindow: {
        label: 'About ' + app.getName(),
        role: 'about',
        category: 'help',
        click: () => {
            const iconPath = getAppIconPath();
            const iconImage = electron.nativeImage.createFromPath(iconPath);
            electron.dialog.showMessageBox({
                title: `About ${app.getName()}`,
                message: `${app.getName()}, version ${app.getVersion()}`,
                detail: `Program: ${app.getAppPath()}\nData: ${getAppDataDir()}\n\n${app.getName()} is open source software distributed under the MIT license.`,
                icon: iconImage,
            });
        },
    },
};



