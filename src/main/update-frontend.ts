import {app, autoUpdater, dialog} from "electron";
import * as os from "os";


export default function installAutoUpdate() {
    if (process.env.NODE_ENV === 'development') {
        return;
    }

    const platform = os.platform();
    if (platform === "linux") {
        return;
    }

    const server = 'https://your-deployment-url.com';
    const feed = `${server}/update/${process.platform}/${app.getVersion()}`;

    autoUpdater.setFeedURL(feed);

    autoUpdater.on('error', message => {
        console.error('There was a problem updating the application');
        console.error(message);
    });

    autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
        const dialogOpts = {
            type: 'info',
            buttons: ['Restart', 'Later'],
            title: 'Application Update',
            message: process.platform === 'win32' ? releaseNotes : releaseName,
            detail: 'A new version has been downloaded. Restart the application to apply the updates.'
        };

        dialog.showMessageBox(dialogOpts, (response) => {
            if (response === 0) {
                autoUpdater.quitAndInstall();
            }
        })
    });

    // Check for updates every minute
    setInterval(() => autoUpdater.checkForUpdates(), 60000);
}
