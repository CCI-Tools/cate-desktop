import * as url from "url";
import * as fs from "fs";
import * as path from "path";
import {getAppIconPath} from "./appenv";
import * as electron from "electron";
import {ifInternet} from "./dnsutil";
import {CATE_MODE_NEW_CATE_DIR, SETUP_MODE_AUTO, SETUP_MODE_USER, SetupOptions} from "../common/setup";
import {DownloadMiniconda, InstallMiniconda, InstallOrUpdateCate} from "./update-backend";
import {isNumber} from "../common/types";
import {RequirementSet} from "./requirement";

export function openSetupWindow() {
    const dialogTitle = "Cate Desktop Setup";

    ifInternet().then(() => {
        const setupWindow = new electron.BrowserWindow({
                                                           title: dialogTitle,
                                                           width: 600,
                                                           height: 400,
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
        electron.ipcMain.on("validateFileIsExecutable", validateFileIsExecutable);
        electron.ipcMain.on("validateExistingDirIsEmpty", validateExistingDirIsEmpty);
        electron.ipcMain.on("performSetupTasks", performSetupTasks);
    }).catch(() => {
        const messageBoxOptions = {
            type: "error",
            title: dialogTitle,
            icon: getAppIconPath() as any,
            message: "Internet connection required.",
            detail: "Cate Desktop wants to perform some setup tasks for which additional online resources are needed.",
        };
        electron.dialog.showMessageBox(messageBoxOptions, quitApp);
    });
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

function validateFileIsExecutable(event, exeFile: string) {
    const channel = "validateFileIsExecutable-response";
    if (!path.isAbsolute(exeFile)) {
        event.sender.send(channel, `Executable file path must be absolute`);
        return;
    }
    fs.access(exeFile, fs.constants.F_OK | fs.constants.X_OK, (err) => {
        if (err) {
            console.log("access ERROR", err);
            event.sender.send(channel, `${exeFile} is not executable`);
        } else {
            event.sender.send(channel, null);
        }
    });
}

function validateExistingDirIsEmpty(event, dirPath: string) {
    const channel = "validateExistingDirIsEmpty-response";
    if (!path.isAbsolute(dirPath)) {
        event.sender.send(channel, `Directory path must be absolute`);
        return;
    }
    fs.access(dirPath, fs.constants.O_DIRECTORY | fs.constants.R_OK | fs.constants.W_OK, (err) => {
        if (err) {
            if (err.code === "ENOENT") {
                event.sender.send(channel, null);
            } else {
                event.sender.send(channel, `${dirPath} has access restrictions`);
            }
        } else {
            fs.readdir(dirPath, (err, files) => {
                if (err) {
                    event.sender.send(channel, `${dirPath} is not readable`);
                } else if (files && files.length > 0) {
                    event.sender.send(channel, `${dirPath} is not empty`);
                } else {
                    event.sender.send(channel, null);
                }
            });
        }
    });
}


export function performSetupTasks(event, setupOptions: SetupOptions) {
    //const minicondaInstallDir = path.join(os.homedir(), 'cate-test-1');
    const channel = "performSetupTasks-response";

    let condaMode;
    let cateMode;
    let newCateDir;
    let oldCateDir;
    let condaDir;
    if (setupOptions.setupMode === SETUP_MODE_AUTO) {
        cateMode = CATE_MODE_NEW_CATE_DIR;
        newCateDir = path.join(electron.app.getPath("home"), "cate");
    } else if (setupOptions.setupMode === SETUP_MODE_USER) {
        cateMode = setupOptions.cateMode;
        newCateDir = setupOptions.newCateDir;
        oldCateDir = setupOptions.oldCateDir;
        condaDir = setupOptions.condaDir;
    }

    let downloadMiniconda = new DownloadMiniconda();
    let installMiniconda = new InstallMiniconda(newCateDir);
    let installOrUpdateCate = new InstallOrUpdateCate(newCateDir || oldCateDir);
    let requirementSet = new RequirementSet(downloadMiniconda,
                                            installMiniconda,
                                            installOrUpdateCate);

    let done = false;
    requirementSet.fulfillRequirement(installOrUpdateCate.id, progress => {
        console.log(progress);
        done = isNumber(progress.worked) && progress.worked === progress.totalWork;
    }).then(() => {
        console.log('Cate CLI updated successfully.')
    }).catch(reason => {
        console.error('Failed to update Cate CLI due to the following error:');
        console.error(reason);
    });
}
