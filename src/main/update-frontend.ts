import {autoUpdater} from "electron-updater";
import * as log from "electron-log";


export function installAutoUpdate() {
    log.info("Installing auto-update...");

    log.transports.file.level = 'info';
    autoUpdater.logger = log;

    autoUpdater.checkForUpdatesAndNotify().then(() => {
        log.info("Update-checking installed.");
    });

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
    // app.on('ready', function()  {
    //   autoUpdater.checkForUpdates();
    // });
    // autoUpdater.on('checking-for-update', () => {
    // })
    // autoUpdater.on('update-available', (info) => {
    // })
    // autoUpdater.on('update-not-available', (info) => {
    // })
    // autoUpdater.on('error', (err) => {
    // })
    // autoUpdater.on('download-progress', (progressObj) => {
    // })
    // autoUpdater.on('update-downloaded', (info) => {
    //   autoUpdater.quitAndInstall();
    // })
}
