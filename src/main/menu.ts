import * as electron from 'electron';
import {actions} from './actions';

const app = electron.app;

const OS_IS_DARWIN = process.platform === 'darwin';
const OS_IS_NOT_DARWIN = !OS_IS_DARWIN;

const ________________ = {type: 'separator'};

const fileSubMenu: Array<any> = [
    actions.newWorkspace,
    actions.openWorkspace,
    actions.closeWorkspace,
    ________________,
    actions.saveWorkspace,
    actions.saveWorkspaceAs,
];

if (OS_IS_NOT_DARWIN) {
    fileSubMenu.push(
        ________________,
        actions.preferences,
        ________________,
        actions.exit
    );
}

const editSubMenu: Array<any> = [
    actions.undo,
    actions.redo,
    ________________,
    actions.cut,
    actions.copy,
    actions.paste,
    actions.pasteAndMatchStyle,
    actions.deleteSel,
    ________________,
    actions.selectAll,
];

if (OS_IS_DARWIN) {
    editSubMenu.push(
        ________________,
        {
            label: 'Speech',
            submenu: [
                actions.startSpeaking,
                actions.stopSpeaking,
            ]
        }
    );
}

let viewSubMenu = [
    actions.toggleFullScreen,
    ________________,
    actions.resetPageZoom,
    actions.zoomInPage,
    actions.zoomOutPage,
    ________________,
    // TODO (forman): we currently can't reload - why?
    // actions.reload,
    actions.toggleDevTools,
];

let toolsSubMenu = [
    actions.addPOI,
    actions.removePOI,
    actions.removeAllPOIs,
];

let windowSubMenu;
if (OS_IS_DARWIN) {
    windowSubMenu = [
        actions.minimize,
        actions.close,
        ________________,
        actions.zoom,
        ________________,
        actions.front,
    ];
} else {
    windowSubMenu = [];
}

const helpSubMenu: Array<any> = [
    actions.openUserGuide,
    actions.openIssueTracker,
    actions.openEsaCCI,
];
if (OS_IS_NOT_DARWIN) {
    helpSubMenu.push(
        ________________,
        actions.openAboutWindow
    );
}

const fileMenu = {
    label: 'File',
    role: 'file',
    submenu: fileSubMenu
};

const editMenu = {
    label: 'Edit',
    role: 'edit',
    submenu: editSubMenu
};

const viewMenu = {
    label: 'View',
    role: 'view',
    submenu: viewSubMenu
};

const toolsMenu = {
    label: 'Tools',
    role: 'tools',
    submenu: toolsSubMenu,
};

const windowMenu = {
    label: 'Window',
    role: 'window',
    submenu: windowSubMenu
};

const helpMenu = {
    label: 'Help',
    role: 'help',
    submenu: helpSubMenu
};

export const menuTemplate: Array<any> = [
    fileMenu,
    // editMenu,
    viewMenu,
    // toolsMenu,
    windowMenu,
    helpMenu,
];

if (OS_IS_DARWIN) {
    const appSubMenu = [
        actions.about,
        ________________,
        actions.preferences,
        ________________,
        actions.services,
        ________________,
        actions.hide,
        actions.hideOthers,
        actions.unhide,
        ________________,
        actions.quit,
    ];

    const appMenu = ({
        label: electron.app.getName(),
        submenu: appSubMenu
    });

    menuTemplate.unshift(appMenu);
}
