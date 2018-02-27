import * as electron from "electron";
import {autoUpdater, UpdateCheckResult, UpdateInfo, CancellationToken} from "electron-updater";
import * as log from "electron-log";


const USER_INTERACTION = true;


export function installAutoUpdate() {

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

        autoUpdater.on('update-available', (info) => {
            let options: electron.MessageBoxOptions = {
                title: "Cate Desktop",
                message: `Do you want to download and install it now?`,
                detail: `A new version of Cate Desktop is available:\nVersion ${info.version} from ${info.releaseDate}`,
                //checkboxLabel: "Disable automatic updates",
                //checkboxChecked: false,
                buttons: ["Yes", "No"],
            };
            electron.dialog.showMessageBox(options, (response: number/*, checkboxChecked: boolean*/) => {
                if (response === 0) {
                    autoUpdater.downloadUpdate(cancellationToken);
                }
            });
        });

        autoUpdater.on('update-not-available', (info) => {
        });

        autoUpdater.on('error', (err) => {
            electron.dialog.showErrorBox("Cate Desktop Update", (err && err.toString()) || "Unknown error.");
        });

        autoUpdater.on('download-progress', (progressObj) => {
            log.silly(progressObj);
        });

        autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
            let options: electron.MessageBoxOptions = {
                title: "Cate Desktop Update",
                message: `Update to version ${info.version} (from ${info.releaseDate})?`,
                detail: "A new version of Cate Desktop is ready to be installed.",
                //checkboxLabel: "Disable automatic updates",
                //checkboxChecked: false,
                buttons: ["Yes", "No"],
            };
            electron.dialog.showMessageBox(options, (response: number/*, checkboxChecked: boolean*/) => {
                if (response === 0) {
                    autoUpdater.quitAndInstall();
                }
            });
        });
    }
}
