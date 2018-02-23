import * as url from "url";
import * as fs from "fs";
import * as path from "path";
import {CATE_EXECUTABLES, CONDA_EXECUTABLES, getAppIconPath} from "./appenv";
import * as electron from "electron";
import {ifInternet} from "./dnsutil";
import {
    CATE_MODE_CONDA_DIR,
    CATE_MODE_NEW_CATE_DIR, CATE_MODE_OLD_CATE_DIR, SETUP_MODE_AUTO, SETUP_MODE_USER, SETUP_REASON_INSTALL_CATE,
    SETUP_REASON_UPDATE_CATE,
    SetupInfo,
    SetupOptions, SetupResult
} from "../common/setup";
import {DownloadMiniconda, InstallCondaEnv, InstallMiniconda, InstallOrUpdateCate} from "./update-backend";
import {isNumber} from "../common/types";
import {RequirementError, RequirementProgress, RequirementSet} from "../common/requirement";
import BrowserWindow = Electron.BrowserWindow;
import {CATE_DESKTOP_PREFIX} from "./main";


export function doSetup(setupInfo: SetupInfo, callback: (result?: SetupResult) => void) {
    const dialogTitle = `Cate Desktop ${electron.app.getVersion()} Setup`;

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
        setupWindow.webContents.on('did-finish-load', () => {
            setupWindow.webContents.send("setSetupInfo", setupInfo);
        });
        setupWindow.webContents.openDevTools();
        setupWindow.on('close', () => callback());
        electron.ipcMain.on("cancelSetup", cancelSetup(setupWindow, callback));
        electron.ipcMain.on("endSetup", endSetup(setupWindow, callback));
        electron.ipcMain.on("browseNewCateDir", browseNewCateDir);
        electron.ipcMain.on("browseOldCateDir", browseOldCateDir);
        electron.ipcMain.on("browseCondaDir", browseCondaDir);
        electron.ipcMain.on("validateNewCateDir", validateNewCateDir);
        electron.ipcMain.on("validateOldCateDir", validateOldCateDir);
        electron.ipcMain.on("validateCondaDir", validateCondaDir);
        electron.ipcMain.on("performSetupTasks", performSetupTasks);
    }).catch(() => {
        const messageBoxOptions = {
            type: "error",
            title: dialogTitle,
            icon: getAppIconPath() as any,
            message: "Internet connection required.",
            detail: "Cate Desktop requires performing some setup tasks for which additional online resources are needed.",
        };
        electron.dialog.showMessageBox(messageBoxOptions, quitApp);
    });
}

function quitApp() {
    electron.app.quit();
}

function endSetup(setupWindow: BrowserWindow, callback: (setupResult: SetupResult | null) => void) {
    return (event, setupResult: SetupResult) => {
        endSetupImpl(setupWindow, callback, setupResult);
    };
}

function endSetupImpl(setupWindow: BrowserWindow, callback: (setupResult: SetupResult | null) => void, setupResult: SetupResult | null) {
    setupWindow.hide();
    callback(setupResult);
}

function cancelSetup(setupWindow: BrowserWindow, callback: (setupResult: SetupResult | null) => void) {

    return (event, inProgress: boolean) => {
        if (inProgress) {
            let title = "Cate Desktop Setup";
            electron.dialog.showMessageBox(setupWindow, {
                title,
                detail: `${title} is currently in progress. If you cancel now, won't be able to use Cate.`,
                message: `Really cancel ${title}?`,
                type: "question",
                buttons: ["Yes", "No"],
            }, (response => {
                if (response === 0) {
                    endSetupImpl(setupWindow, callback, null);
                }
            }));
        } else {
            endSetupImpl(setupWindow, callback, null);
        }
    };
}

function browseNewCateDir(event, newCateDir: string) {
    browseDir(event,
              "browseNewCateDir-response",
              "Select Cate Installation Directory",
              newCateDir);
}

function browseOldCateDir(event, oldCateDir: string) {
    browseDir(event,
              "browseOldCateDir-response",
              "Select Cate Installation Directory",
              oldCateDir);
}

function browseCondaDir(event, condaDir: string) {
    browseDir(event,
              "browseCondaDir-response",
              "Select Anaconda/Miniconda Installation Directory",
              condaDir);
}

function browseDir(event, channel: string, title: string, defaultPath: string) {
    const options: electron.OpenDialogOptions = {
        title,
        defaultPath,
        properties: ["createDirectory", "openDirectory", "showHiddenFiles"],
        buttonLabel: "Select",
    };
    electron.dialog.showOpenDialog(options, (filePaths: string[]) => {
        const dirPath = (filePaths && filePaths.length) ? filePaths[0] : null;
        if (dirPath) {
            event.sender.send(channel, dirPath);
        }
    });
}

function validateNewCateDir(event, newCateDir: string) {
    const channel = "validateNewCateDir-response";
    if (validateAbsoluteDir(event, channel, newCateDir)) {
        fs.access(newCateDir, fs.constants.O_DIRECTORY | fs.constants.R_OK | fs.constants.W_OK, (err) => {
            if (err) {
                if (err.code === "ENOENT") {
                    event.sender.send(channel, null);
                } else {
                    event.sender.send(channel, `${newCateDir} has access restrictions`);
                }
            } else {
                fs.readdir(newCateDir, (err, files) => {
                    if (err) {
                        event.sender.send(channel, `${newCateDir} is not readable`);
                    } else if (files && files.length > 0) {
                        event.sender.send(channel, `${newCateDir} is not empty`);
                    } else {
                        event.sender.send(channel, null);
                    }
                });
            }
        });
    }
}

function validateOldCateDir(event, oldCateDir: string) {
    const channel = "validateOldCateDir-response";
    if (validateAbsoluteDir(event, channel, oldCateDir)) {
        validateExecutables(event, channel, oldCateDir, CATE_EXECUTABLES);
    }
}

function validateCondaDir(event, condaDir: string) {
    const channel = "validateCondaDir-response";
    if (validateAbsoluteDir(event, channel, condaDir)) {
        validateExecutables(event, channel, condaDir, CONDA_EXECUTABLES);
    }
}

function validateAbsoluteDir(event, channel: string, dirPath: string): boolean {
    if (!dirPath || dirPath === "") {
        event.sender.send(channel, `Directory must be given`);
        return false;
    }
    if (!path.isAbsolute(dirPath)) {
        event.sender.send(channel, `Directory path must be absolute`);
        return false;
    }
    return true;
}

function validateExecutables(event, channel: string, dirPath: string, executables: string[]) {
    let hasError = false;
    for (let i = 0; i < executables.length && !hasError; i++) {
        let exeFile = path.join(dirPath, executables[i]);
        fs.access(exeFile, fs.constants.F_OK | fs.constants.X_OK, (err) => {
            if (err) {
                hasError = true;
                event.sender.send(channel, `${exeFile} not found or not executable`);
            } else if (i === executables.length - 1) {
                event.sender.send(channel, null);
            }
        });
    }
}

export function performSetupTasks(event, setupInfo: SetupInfo, setupOptions: SetupOptions) {
    const channel = "performSetupTasks-response";

    const {newCateVersion} = setupInfo;
    const {newCateDir, oldCateDir, condaDir} = setupOptions;
    let cateMode = setupOptions.cateMode;

    if (setupOptions.setupMode === SETUP_MODE_AUTO) {
        if (setupInfo.setupReason === SETUP_REASON_INSTALL_CATE) {
            cateMode = CATE_MODE_NEW_CATE_DIR;
        } else if (setupInfo.setupReason === SETUP_REASON_UPDATE_CATE) {
            cateMode = CATE_MODE_OLD_CATE_DIR;
        }
    }

    let requirements;
    if (cateMode === CATE_MODE_NEW_CATE_DIR) {
        const downloadMiniconda = new DownloadMiniconda();
        const installMiniconda = new InstallMiniconda(newCateDir);
        const installOrUpdateCate = new InstallOrUpdateCate(newCateVersion, newCateDir, [installMiniconda.id]);
        requirements = [downloadMiniconda, installMiniconda, installOrUpdateCate];
    } else if (cateMode === CATE_MODE_OLD_CATE_DIR) {
        const installOrUpdateCate = new InstallOrUpdateCate(newCateVersion, oldCateDir, []);
        requirements = [installOrUpdateCate];
    } else if (cateMode === CATE_MODE_CONDA_DIR) {
        const installCondaEnv = new InstallCondaEnv(condaDir);
        const installOrUpdateCate = new InstallOrUpdateCate(newCateVersion, installCondaEnv.getCondaEnvDir(), [installCondaEnv.id]);
        requirements = [installCondaEnv, installOrUpdateCate];
    } else {
        event.sender.send(channel, {error: "?"});
        return;
    }

    const requirementSet = new RequirementSet(requirements);
    requirementSet.fulfillRequirement(requirements[requirements.length - 1].id, (progress: RequirementProgress) => {
        console.log(progress);
        event.sender.send(channel, 0, null, progress);
    }).then(() => {
        console.log(CATE_DESKTOP_PREFIX, 'Setup successful')
        event.sender.send(channel, 0);
    }).catch((error: RequirementError) => {
        console.error(CATE_DESKTOP_PREFIX, 'Setup failed:', error);
        event.sender.send(channel, -1, error.reason);
    });
}
