import * as electron from 'electron';
import * as path from 'path';

const app = electron.app;

export function getAppIconPath() {
    let iconFile = "cate-icon.png";
    if (process.platform === "darwin") {
        iconFile = "darwin/cate-icon.hqx";
    } else if (process.platform === "win32") {
        iconFile = "win32/cate-icon.ico";
    }
    return path.join(app.getAppPath(), 'resources', iconFile);
}

export function getAppDataDir() {
    return path.join(app.getPath('home'), '.cate');
}
