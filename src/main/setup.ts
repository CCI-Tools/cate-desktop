import * as url from "url";
import {getAppIconPath} from "./appenv";
import * as electron from "electron";
import * as path from "path";

export function openSetupWindow() {
    const setupWindow = new electron.BrowserWindow({
                                                       title: "Cate Desktop Setup",
                                                       width: 580,
                                                       height: 320,
                                                       center: true,
                                                       show: true,
                                                       minimizable: false,
                                                       maximizable: false,
                                                       fullscreenable: false,
                                                       useContentSize: true,
                                                       alwaysOnTop: false,
                                                       icon: getAppIconPath(),
                                                   });
    setupWindow.setMenu(null);
    setupWindow.loadURL(url.format({
                                       pathname: path.join(electron.app.getAppPath(), 'setup.html'),
                                       protocol: 'file:',
                                       slashes: true
                                   }));

    setupWindow.webContents.openDevTools();

    setupWindow.on('closed', quitApp);

    electron.ipcMain.on("endSetup", quitApp);
    electron.ipcMain.on("cancelSetup", quitApp);
    electron.ipcMain.on("browseTargetDir", selectTargetDir);
    electron.ipcMain.on("browsePythonExe", selectPythonExe);
}

function quitApp() {
    electron.app.quit();
}

function selectTargetDir(event, targetDir: string) {
    const options: electron.OpenDialogOptions = {
        title: "Select Target Directory",
        properties: ["createDirectory", "openDirectory", "showHiddenFiles"],
        defaultPath: targetDir,
        buttonLabel: "Select",
    };
    electron.dialog.showOpenDialog(options, (filePaths: string[]) => {
        const targetDir = (filePaths && filePaths.length) ? filePaths[0] : null;
        if (targetDir) {
            event.sender.send("browseTargetDir-response", targetDir);
        }
    });
}

function selectPythonExe(event, pythonExe: string) {
    const options: electron.OpenDialogOptions = {
        title: "Select Python Executable File",
        properties: ["openFile", "showHiddenFiles"],
        defaultPath: pythonExe,
        filters: [{name: "Executables", extensions: ["exe"]}, {name: 'All Files', extensions: ['*']}],
        buttonLabel: "Select",
    };
    electron.dialog.showOpenDialog(options, (filePaths: string[]) => {
        const pythonExe = (filePaths && filePaths.length) ? filePaths[0] : null;
        if (pythonExe) {
            event.sender.send("browsePythonExe-response", pythonExe);
        }
    });
}
