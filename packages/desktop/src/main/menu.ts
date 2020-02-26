import * as electron from 'electron';
import { getActions } from './actions';
import { Configuration } from './configuration';

export function getMenuTemplate(configuration: Configuration) {

    const isDarwin = process.platform === 'darwin';
    const isNotDarwin = !isDarwin;
    const actions = getActions(configuration);


    const ________________ = {type: 'separator'};

    const fileSubMenu: Array<any> = [
        actions.newWorkspace,
        actions.openWorkspace,
        actions.closeWorkspace,
        ________________,
        actions.saveWorkspace,
        actions.saveWorkspaceAs,
        ________________,
        actions.deleteWorkspace,
    ];

    if (isNotDarwin) {
        fileSubMenu.push(
            ________________,
            actions.preferences,
            ________________,
            actions.logout,
            ________________,
            actions.exit
        );
    }

    const editSubMenu = [];
    // const editSubMenu: Array<any> = [
    //     actions.undo,
    //     actions.redo,
    //     ________________,
    //     actions.cut,
    //     actions.copy,
    //     actions.paste,
    //     actions.pasteAndMatchStyle,
    //     actions.deleteSel,
    //     ________________,
    //     actions.selectAll,
    // ];
    //
    // if (isDarwin) {
    //     editSubMenu.push(
    //         ________________,
    //         {
    //             label: 'Speech',
    //             submenu: [
    //                 actions.startSpeaking,
    //                 actions.stopSpeaking,
    //             ]
    //         }
    //     );
    // }

    let viewSubMenu = [
        actions.toggleFullScreen,
        ________________,
        actions.resetPageZoom,
        actions.zoomInPage,
        actions.zoomOutPage,
        ________________,
        // actions.reload,
        actions.toggleDevTools,
    ];

    let windowSubMenu;
    if (isDarwin) {
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
        actions.openWebsite,
        actions.openDocumentation,
        actions.openDownloads,
        actions.openIssueTracker,
        actions.openEsaCCI,
        // ________________,
        // actions.checkForUpdates,
    ];
    if (isNotDarwin) {
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

    const allMenus: Array<any> = [
        fileMenu,
        editMenu,
        viewMenu,
        windowMenu,
        helpMenu,
    ];

    const menuTemplate: Array<any> = allMenus.filter(m => m.submenu && m.submenu.length);

    if (isDarwin) {
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
            actions.logout,
            ________________,
            actions.quit,
        ];

        const appMenu = ({
            label: electron.app.getName(),
            submenu: appSubMenu
        });

        menuTemplate.unshift(appMenu);
    }

    return menuTemplate;
}
