import * as electron from "electron";
import { autoUpdater, UpdateCheckResult, UpdateInfo, CancellationToken } from "electron-updater";
import * as log from "electron-log";


const TITLE = "Cate Desktop Update";
const USER_INTERACTION = false;

let _autoQuitAndInstall = false;


export function installAutoUpdate(mainWindow: electron.BrowserWindow) {

    autoUpdater.logger = log;

    log.info("Installing update-check...");

    if (!USER_INTERACTION) {
        //-------------------------------------------------------------------
        // Auto updates - Option 1 - Simplest version
        //
        // This will immediately download an update, then install when the
        // app quits.
        //-------------------------------------------------------------------
        const promise = autoUpdater.checkForUpdatesAndNotify();
        if (promise) {
            promise && promise.then((result: UpdateCheckResult) => {
                log.info("Update-check result:", result);
            });
        } else {
            log.error("Update-check NOT installed");
        }
    } else {

        // TODO (nf): this update Option 2 is preferred, but doesn't work yet.
        // autoUpdater.quitAndInstall() on "update-downloaded" doesn't install the update
        // and doesn't restart Cate Desktop :(

        //-------------------------------------------------------------------
        // Auto updates - Option 2 - More control
        //
        // For details about these events, see the Wiki:
        // https://github.com/electron-userland/electron-builder/wiki/Auto-Update#events
        //
        // The app doesn't need to listen to any events except `update-downloaded`
        //
        // Uncomment any of the below events to listen for them.  Also,
        // look in the previous section to see them being used.
        //-------------------------------------------------------------------

        const cancellationToken: CancellationToken = new CancellationToken();
        autoUpdater.autoDownload = false;
        autoUpdater.autoInstallOnAppQuit = false;

        autoUpdater.checkForUpdates().then((result: UpdateCheckResult) => {
            log.info("Update-check result:", result);
        });

        autoUpdater.on('checking-for-update', () => {
        });

        autoUpdater.on('update-available', (info: UpdateInfo) => {
            if (!mainWindow.isDestroyed()) {
                let options: electron.MessageBoxOptions = {
                    title: TITLE,
                    message: `An update of Cate Desktop is available!`,
                    detail: `Version: ${info.version}\nRelease date: ${info.releaseDate}\n\nDo you want to download and install it now?`,
                    checkboxLabel: "Shutdown immediately after download and install update.",
                    checkboxChecked: _autoQuitAndInstall,
                    buttons: ["OK", "Cancel"],
                };
                electron.dialog.showMessageBox(mainWindow, options).then((returnValue: electron.MessageBoxReturnValue) => {
                    if (returnValue.response === 0) {
                        _autoQuitAndInstall = returnValue.checkboxChecked;
                        autoUpdater.downloadUpdate(cancellationToken).then(() => true);
                    }
                });
            }
        });

        // noinspection JSUnusedLocalSymbols
        autoUpdater.on('update-not-available', (info) => {
        });

        autoUpdater.on('error', (err) => {
            electron.dialog.showErrorBox(TITLE, (err && err.toString()) || "An unknown error occurred during update.");
        });

        autoUpdater.on('download-progress', (progressObj) => {
            log.silly(progressObj);
        });

        // noinspection JSUnusedLocalSymbols
        autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
            if (_autoQuitAndInstall) {
                autoUpdater.quitAndInstall();
            } else if (!mainWindow.isDestroyed()) {
                let options: electron.MessageBoxOptions = {
                    title: TITLE,
                    message: "The update is now ready to be installed.",
                    detail: "Clicking OK will shutdown Cate Desktop and install the update.",
                    buttons: ["OK", "Cancel"],
                };
                electron.dialog.showMessageBox(mainWindow, options).then((returnValue: electron.MessageBoxReturnValue) => {
                    if (returnValue.response === 0) {
                        autoUpdater.quitAndInstall();
                    }
                });
            }
        });
    }
}
