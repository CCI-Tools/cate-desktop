import * as electron from 'electron';
import installDevToolsExtension from 'electron-devtools-installer';
import * as devTools from 'electron-devtools-installer';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import * as child_process from 'child_process'
import * as semver from "semver";
import {request} from './request';
import {updateConditionally} from '../common/objutil';
import {Configuration} from "./configuration";
import {menuTemplate} from "./menu";
import {error} from "util";
import {pep440ToSemver} from "../common/version";
import {getAppDataDir, getAppIconPath} from "./appenv";

const PREFS_OPTIONS = ['--prefs', '-p'];
const CONFIG_OPTIONS = ['--config', '-c'];
const CATE_WEBAPI_PREFIX = 'cate-webapi:';
const CATE_DESKTOP_PREFIX = 'cate-desktop:';

// Module to control application life.
const app = electron.app;

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const ipcMain = electron.ipcMain;
const dialog = electron.dialog;

/**
 * Identifies the required version of the Cate WebAPI.
 * The value is a node-semver (https://github.com/npm/node-semver) compatible version range string.
 * @type {string}
 */
export const WEBAPI_VERSION_RANGE = ">=0.9.0-dev.3 <1.0.0";

const WEBAPI_INSTALLER_CANCELLED = 1;
const WEBAPI_INSTALLER_ERROR = 2;
const WEBAPI_INSTALLER_MISSING = 3;
const WEBAPI_INSTALLER_BAD_EXIT = 4;
const WEBAPI_ERROR = 5;
const WEBAPI_BAD_EXIT = 6;
const WEBAPI_TIMEOUT = 7;
const WEBAPI_MISSING = 8;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let _mainWindow;
let _splashWindow;
let _prefs: Configuration;
let _config: Configuration;
let _prefsUpdateRequestedOnClose = false;
let _prefsUpdatedOnClose = false;


function getOptionArg(options: string[]) {
    let args: Array<string> = process.argv.slice(1);
    for (let i = 0; i < args.length; i++) {
        let arg = args[i];
        if (options.indexOf(arg) >= 0 && i < args.length - 1) {
            return args[i];
        }
    }
    return null;
}

function loadConfiguration(options: string[], defaultConfigFile: string, configType: string): Configuration {
    let config = new Configuration();
    let configFile = getOptionArg(options);
    if (!configFile) {
        configFile = defaultConfigFile;
        if (!fs.existsSync(configFile)) {
            return config;
        }
    }
    config.load(configFile, (err) => {
        if (err) {
            console.error(CATE_DESKTOP_PREFIX, `${configType} could not be loaded from "${configFile}"`, err);
        } else {
            console.log(CATE_DESKTOP_PREFIX, `${configType} successfully loaded from "${configFile}"`);
        }
    });
    return config;
}

function storeConfiguration(config: Configuration, options: string[], defaultConfigFile: string, configType: string) {
    let configFile = getOptionArg(options);
    if (!configFile) {
        configFile = defaultConfigFile;
        let dir = path.dirname(configFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
    }
    config.store(configFile, (err) => {
        if (err) {
            console.error(CATE_DESKTOP_PREFIX, `${configType} could not be stored in "${configFile}"`, err);
        } else {
            console.log(CATE_DESKTOP_PREFIX, `${configType} successfully stored in "${configFile}"`);
        }
    });
}

function loadBackendLocation() {
    const dataDir = getAppDataDir();
    if (!fs.existsSync(dataDir)) {
        // Return immediately if there is no dataDir (yet).
        return null;
    }

    const fileNames = fs.readdirSync(dataDir);
    const backendLocations = {};
    for (let fileName of fileNames) {
        const locationFile = path.join(dataDir, fileName, 'cate.location');
        if (fs.existsSync(locationFile)) {
            let location = fs.readFileSync(locationFile, 'utf8');
            if (location) {
                location = location.trim();
                const webApiExe = path.join(location, process.platform === 'win32' ? 'Scripts\\cate-webapi.exe' : 'bin/cate-webapi');
                if (fs.existsSync(webApiExe)) {
                    const version = pep440ToSemver(fileName);
                    if (semver.valid(version, true)) {
                        // Return immediately if the versions are equal.
                        if (semver.eq(version, app.getVersion(), true)) {
                            return webApiExe;
                        }
                        backendLocations[version] = webApiExe;
                    }
                }
            }
        }
    }

    let descendingVersions = Object.getOwnPropertyNames(backendLocations);
    descendingVersions.sort((v1: string, v2: string) => semver.compare(v2, v1, true));

    for (let version of descendingVersions) {
        if (semver.satisfies(version, WEBAPI_VERSION_RANGE, true)) {
            return backendLocations[version];
        }
    }

    return null;
}

function loadAppConfig(): Configuration {
    return loadConfiguration(CONFIG_OPTIONS, path.resolve('cate-config.js'), 'App configuration');
}

function getDefaultUserPrefsFile() {
    if (_config.data.prefsFile) {
        return _config.data.prefsFile;
    }
    return path.join(getAppDataDir(), 'preferences.json');
}

function storeUserPrefs(prefs: Configuration) {
    storeConfiguration(prefs, PREFS_OPTIONS, getDefaultUserPrefsFile(), 'User preferences')
}

function loadUserPrefs(): Configuration {
    return loadConfiguration(PREFS_OPTIONS, getDefaultUserPrefsFile(), 'User preferences');
}


function getWebAPICommonArgs(webAPIConfig) {
    return [
        '--caller', 'cate-desktop',
        '--port', webAPIConfig.servicePort,
        '--address', webAPIConfig.serviceAddress,
        '--file', webAPIConfig.serviceFile,
    ];
}


function getWebAPIStartArgs(webAPIConfig) {
    return getWebAPICommonArgs(webAPIConfig).concat('start');
}

function getWebAPIStopArgs(webAPIConfig) {
    return getWebAPICommonArgs(webAPIConfig).concat('stop');
}

function getWebAPIRestUrl(webAPIConfig) {
    return `http://${webAPIConfig.serviceAddress || '127.0.0.1'}:${webAPIConfig.servicePort}/`;
}

function getAPIWebSocketsUrl(webAPIConfig) {
    return `ws://${webAPIConfig.serviceAddress || '127.0.0.1'}:${webAPIConfig.servicePort}/api`;
}

function getMPLWebSocketsUrl(webAPIConfig) {
    return `ws://${webAPIConfig.serviceAddress || '127.0.0.1'}:${webAPIConfig.servicePort}/mpl/figures/`;
}

export function init() {
    if (process.platform === 'darwin') {
        // Try getting around https://github.com/CCI-Tools/cate-desktop/issues/32
        // See https://electron.atom.io/docs/api/app/#appcommandlineappendswitchswitch-value
        app.commandLine.appendSwitch('disable_chromium_framebuffer_multisample');
    }

    _config = loadAppConfig();
    _prefs = loadUserPrefs();

    // By default NODE_ENV will be 'production' so react is much faster
    process.env.NODE_ENV = _config.get('NODE_ENV', 'production');
    console.log('process.env.NODE_ENV = ' + process.env.NODE_ENV);

    let webAPIConfig = _config.get('webAPIConfig', {});
    webAPIConfig = updateConditionally(webAPIConfig, {
        servicePort: 9090,
        serviceAddress: '',
        serviceFile: path.join(getAppDataDir(), 'webapi-info.json'),
        // Refer to https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
        processOptions: {},
    });
    const backendLocation = loadBackendLocation();
    if (backendLocation) {
        webAPIConfig = updateConditionally(webAPIConfig, {
            command: backendLocation
        });
    }
    _config.set('webAPIConfig', webAPIConfig);

    console.log(CATE_DESKTOP_PREFIX, 'appConfig:', _config.data);
    console.log(CATE_DESKTOP_PREFIX, 'userPrefs:', _prefs.data);

    let webAPIStarted = false;
    // Remember error occurred so
    let webAPIError = null;

    let webAPIProcess = null;

    const processOptions = {
        //detached: false,
        //stdio: 'inherit',
        ...webAPIConfig.processOptions
    };
    if (process.platform === 'win32' && webAPIConfig.command) {
        // For Conda executables to run on Windows, we must activate the environment.
        // We emulate this, by setting creating an equivalent environment
        const scriptsPath = path.dirname(webAPIConfig.command);
        const pythonPath = path.dirname(scriptsPath);
        const env = {};
        env['GDAL_DATA'] = `${pythonPath}\\Library\\share\\gdal`;
        env['PROJ_LIB='] = `${pythonPath}\\Library\\share`;
        env['PATH'] = `${pythonPath};${pythonPath}\\Library\\bin;${scriptsPath};${process.env.PATH}`;
        processOptions.env = {...processOptions.env, ...env};
    }

    function startWebapiService(): child_process.ChildProcess {

        if (!webAPIConfig.command) {
            electron.dialog.showErrorBox(`${app.getName()} - Internal Error`,
                'Failed to start Cate WebAPI service.\nCate backend could not be found.');
            app.exit(WEBAPI_MISSING); // exit immediately
        }

        const webAPIStartArgs = getWebAPIStartArgs(webAPIConfig);
        console.log(CATE_DESKTOP_PREFIX, `Starting Cate WebAPI service using arguments: ${webAPIStartArgs}`);

        const webAPIProcess = child_process.spawn(webAPIConfig.command, webAPIStartArgs, processOptions);
        webAPIStarted = true;
        console.log(CATE_DESKTOP_PREFIX, 'Cate WebAPI service started:', webAPIProcess);
        webAPIProcess.stdout.on('data', (data: any) => {
            console.log(CATE_WEBAPI_PREFIX, `${data}`);
        });
        webAPIProcess.stderr.on('data', (data: any) => {
            console.error(CATE_WEBAPI_PREFIX, `${data}`);
        });
        webAPIProcess.on('error', (err: Error) => {
            console.error(CATE_WEBAPI_PREFIX, err);
            if (!webAPIError) {
                electron.dialog.showErrorBox(`${app.getName()} - Internal Error`,
                    'Failed to start Cate WebAPI service.');
            }
            webAPIError = err;
            app.exit(WEBAPI_ERROR); // exit immediately
        });
        webAPIProcess.on('close', (code: number) => {
            let message = `Cate WebAPI service process exited with code ${code}.`;
            console.log(CATE_WEBAPI_PREFIX, message);
            if (code != 0) {
                if (!webAPIError) {
                    electron.dialog.showErrorBox(`${app.getName()} - Internal Error`, message);
                }
                webAPIError = new Error(message);
                app.exit(WEBAPI_BAD_EXIT); // exit immediately
            }
        });
        return webAPIProcess;
    }

    function stopWebapiService(webAPIProcess) {
        if (!webAPIProcess) {
            return;
        }
        if (!webAPIConfig.command) {
            electron.dialog.showErrorBox(`${app.getName()} - Internal Error`,
                'Failed to stop Cate WebAPI service.\nCate backend could not be found.');
            return;
        }
        // Note we are async here, because sync can take a lot of time...
        const webAPIStopArgs = getWebAPIStopArgs(webAPIConfig);
        console.log(CATE_DESKTOP_PREFIX, `Stopping Cate WebAPI service using arguments: ${webAPIStopArgs}`);
        child_process.spawn(webAPIConfig.command, webAPIStopArgs, processOptions);
        // child_process.spawnSync(webAPIConfig.command, webAPIStopArgs, webAPIConfig.options);
    }

    function startUpWithWebapiService() {
        const msServiceAccessTimeout = 1000; // ms
        const msServiceStartTimeout = 5000; // ms
        const msDelay = 500; // ms
        let msSpend = 0; // ms
        let webAPIRestUrl = getWebAPIRestUrl(_config.data.webAPIConfig);
        console.log(CATE_DESKTOP_PREFIX, `Waiting for response from ${webAPIRestUrl}`);
        showSplashMessage('Waiting for Cate backend response...');
        request(webAPIRestUrl, msServiceAccessTimeout)
            .then((response: string) => {
                console.log(CATE_WEBAPI_PREFIX, response);
                createMainWindow();
            })
            .catch((err) => {
                console.log(CATE_DESKTOP_PREFIX, `Waiting for Cate WebAPI service to respond after ${msSpend} ms`);
                if (!webAPIStarted) {
                    webAPIProcess = startWebapiService();
                }
                if (msSpend > msServiceStartTimeout) {
                    console.error(CATE_DESKTOP_PREFIX, `Failed to start Cate WebAPI service within ${msSpend} ms.`, err);
                    if (!webAPIError) {
                        electron.dialog.showErrorBox(`${app.getName()} - Internal Error`, `Failed to start Cate backend within ${msSpend} ms.`);
                    }
                    app.exit(WEBAPI_TIMEOUT);
                } else {
                    setTimeout(startUpWithWebapiService, msDelay);
                    msSpend += msDelay;
                }
            });
    }

    // Emitted when Electron has finished initializing.
    app.on('ready', (): void => {
        checkWebapiServiceExecutable((installerPath: string) => {
            createSplashWindow(() => {
                installBackend(installerPath, () => {
                    console.log(CATE_DESKTOP_PREFIX, 'Ready.');
                    startUpWithWebapiService();
                });
            });
        });
    });

    // Emitted when all windows have been closed and the application will quit.
    app.on('quit', () => {
        console.log(CATE_DESKTOP_PREFIX, 'Quit.');
        stopWebapiService(webAPIProcess);
    });

    // Emitted when all windows have been closed.
    app.on('window-all-closed', () => {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    // OS X: Emitted when the application is activated, which usually happens when the user clicks
    // on the application's dock icon.
    app.on('activate', () => {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (_mainWindow === null) {
            // TODO (forman): must find out what Mac OS expects an app to do, once it becomes deactivated
            //   - is it a complete restart or should it remain in its previous state?
            //   - must we stop the webapi on "deactivate" and start on "activate"?
            createMainWindow();
        }
    });

    // In this file you can include the rest of your app's specific main process
    // code. You can also put them in separate files and require them here.
}

function createSplashWindow(callback: () => void) {
    _splashWindow = new BrowserWindow({
        width: 256,
        height: 276,
        center: true,
        useContentSize: true,
        frame: false,
        alwaysOnTop: true,
        transparent: true,
    });
    _splashWindow.loadURL(url.format({
        pathname: path.join(app.getAppPath(), 'splash.html'),
        protocol: 'file:',
        slashes: true
    }));
    _splashWindow.on('closed', () => {
        _splashWindow = null;
    });
    _splashWindow.webContents.on('did-finish-load', callback);
}

function showSplashMessage(message: string) {
    console.log(CATE_DESKTOP_PREFIX, 'Splash says:', message);
    if (_splashWindow && _splashWindow.isVisible()) {
        _splashWindow.webContents.send('update-splash-message', message);
    } else {
        console.warn(CATE_DESKTOP_PREFIX, 'showSplashMessage: splash not visible', message);
    }
}

function createMainWindow() {

    if (_config.data.devToolsExtensions) {
        showSplashMessage('Installing developer tools...');
        for (let devToolsExtensionName of _config.data.devToolsExtensions) {
            const devToolExtension = devTools[devToolsExtensionName];
            if (devToolExtension) {
                installDevToolsExtension(devToolExtension)
                    .then((name) => console.log(CATE_DESKTOP_PREFIX, `Added DevTools extension "${devToolsExtensionName}"`))
                    .catch((err) => console.error(CATE_DESKTOP_PREFIX, 'Failed to add DevTools extension: ', err));
            }
        }
    }

    showSplashMessage('Loading user interface...');

    const mainWindowBounds = _prefs.data.mainWindowBounds || {width: 1366, height: 768};

    _mainWindow = new BrowserWindow({
        icon: getAppIconPath(),
        title: `${app.getName()} ${app.getVersion()}`,
        ...mainWindowBounds
    });

    const menu = electron.Menu.buildFromTemplate(menuTemplate);
    electron.Menu.setApplicationMenu(menu);

    _mainWindow.loadURL(url.format({
        pathname: path.join(app.getAppPath(), 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    _mainWindow.webContents.on('did-finish-load', () => {
        showSplashMessage('Done.');
        if (_splashWindow) {
            _splashWindow.close();

            const webAPIConfig = _config.data.webAPIConfig;
            _mainWindow.webContents.send('apply-initial-state', {
                session: _prefs.data,
                appConfig: Object.assign({}, _config.data, {
                    appPath: app.getAppPath(),
                    webAPIConfig: Object.assign({}, webAPIConfig, {
                        restUrl: getWebAPIRestUrl(webAPIConfig),
                        apiWebSocketUrl: getAPIWebSocketsUrl(webAPIConfig),
                        mplWebSocketUrl: getMPLWebSocketsUrl(webAPIConfig),
                    }),
                })
            });
        }
    });

    if (_prefs.data.devToolsOpened) {
        // Open the DevTools.
        _mainWindow.webContents.openDevTools();
    }

    // Emitted when the web page has been rendered and window can be displayed without a visual flash.
    _mainWindow.on('ready-to-show', () => {
        console.log(CATE_DESKTOP_PREFIX, 'Main window is ready to show.');
    });

    // Emitted when the window is going to be closed.
    _mainWindow.on('close', (event) => {
        if (!_prefsUpdateRequestedOnClose) {
            _prefsUpdateRequestedOnClose = true;
            event.preventDefault();
            console.log(CATE_DESKTOP_PREFIX, 'Main window is going to be closed, fetching user preferences...');
            _prefs.set('mainWindowBounds', _mainWindow.getBounds());
            _prefs.set('devToolsOpened', _mainWindow.webContents.isDevToolsOpened());
            event.sender.send('get-preferences');
        } else if (!_prefsUpdatedOnClose) {
            event.preventDefault();
        }
    });

    // Emitted when the window is closed.
    _mainWindow.on('closed', () => {
        console.log(CATE_DESKTOP_PREFIX, 'Main window closed.');
        storeUserPrefs(_prefs);
        _prefs = null;
        _config = null;
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        _mainWindow = null;
    });

    ipcMain.on('show-open-dialog', (event, openDialogOptions, synchronous?: boolean) => {
        dialog.showOpenDialog(_mainWindow, openDialogOptions, (filePaths: Array<string>) => {
            // console.log('show-open-dialog: filePaths =', filePaths);
            if (synchronous) {
                event.returnValue = filePaths && filePaths.length ? filePaths : null;
            } else {
                event.sender.send('show-open-dialog-reply', filePaths);
            }
        });
    });

    ipcMain.on('show-save-dialog', (event, saveDialogOptions, synchronous?: boolean) => {
        dialog.showSaveDialog(_mainWindow, saveDialogOptions, (filePath: string) => {
            // console.log('show-save-dialog: filePath =', filePath);
            if (synchronous) {
                event.returnValue = filePath ? filePath : null;
            } else {
                event.sender.send('show-save-dialog-reply', filePath);
            }
        });
    });

    ipcMain.on('show-message-box', (event, messageBoxOptions, synchronous?: boolean) => {
        let reportingEnabled = false;
        if (!messageBoxOptions.checkboxLabel && messageBoxOptions.detail && messageBoxOptions.type === 'error') {
            messageBoxOptions = {
                ...messageBoxOptions,
                checkboxLabel: 'Copy report to clipboard',
                checkboxChecked: false,
            };
            reportingEnabled = true;
        }
        dialog.showMessageBox(_mainWindow, messageBoxOptions, (buttonIndex: number, checkboxChecked: boolean) => {
            if (reportingEnabled && checkboxChecked) {
                const reportEntries = [
                    app.getName() + ', version ' + app.getVersion(),
                    messageBoxOptions.message,
                    messageBoxOptions.detail,
                ];
                electron.clipboard.writeText(reportEntries.join('\n\n'));
            }
            // console.log('show-message-box: buttonIndex =', buttonIndex);
            if (synchronous) {
                event.returnValue = {buttonIndex, checkboxChecked};
            } else {
                event.sender.send('show-message-box-reply', buttonIndex, checkboxChecked);
            }
        });
    });

    ipcMain.on('set-preferences', (event, preferences) => {
        _prefs.setAll(preferences);
        if (_prefsUpdateRequestedOnClose) {
            _prefsUpdatedOnClose = true;
            app.quit();
        } else {
            event.sender.send('set-preferences-reply', error);
        }
    });
}

function checkWebapiServiceExecutable(callback: (installerPath?: string) => void): boolean {
    const webAPIConfig = _config.data.webAPIConfig;
    if (fs.existsSync(webAPIConfig.command)) {
        callback();
        return true;
    }

    const fileNames = fs.readdirSync(app.getAppPath());
    // console.log('fileNames =', fileNames);
    const isWin = process.platform === 'win32';
    const finder = n => n.startsWith('cate-') && (isWin ? (n.endsWith('.exe') || n.endsWith('.bat')) : n.endsWith('.sh'));
    const installerExeName = fileNames.find(finder);
    if (installerExeName) {
        const installerPath = path.join(app.getAppPath(), installerExeName);
        const response = electron.dialog.showMessageBox({
            type: 'info',
            title: `${app.getName()} - Information`,
            buttons: ['Cancel', 'OK'],
            cancelId: 0,
            message: 'About to install missing Cate backend.',
            detail: 'It seems that Cate is run from this installation for the first time.\n' +
            'Cate will now install a local (Python) backend which may take\n' +
            'some minutes. This is a one-time job and only applies to this\n' +
            'Cate installation, no other computer settings will be changed.',
        });
        if (response == 0) {
            electron.app.exit(WEBAPI_INSTALLER_CANCELLED);
            return false;
        } else {
            callback(installerPath);
            return true;
        }
    } else {
        const expectedLoc = webAPIConfig.command ? "The expected location is:\n    '" + webAPIConfig.command + "'\n" : "";
        electron.dialog.showMessageBox({
            type: 'error',
            title: `${app.getName()} - Fatal Error`,
            message: `Cate backend could not be found. ${expectedLoc}\n` +
            'Please install Cate backend first.\n\n' +
            'Application will exit now.',
        });
        electron.app.exit(WEBAPI_MISSING);
        return false;
    }
}

function installBackend(installerCommand: string, callback: () => void) {

    if (!installerCommand) {
        callback();
        return;
    }

    const isWin = process.platform === 'win32';
    const installDir = path.join(app.getAppPath(), 'python');
    const installerArgs = isWin
        ? ['/S', '/InstallationType=JustMe', '/AddToPath=0', '/RegisterPython=0', `/D=${installDir}`]
        : ['-b', '-f', '-p', installDir];

    console.log(CATE_DESKTOP_PREFIX, `running backend installer "${installerCommand}" with arguments ${installerArgs}`);
    showSplashMessage('Running backend installer, please wait...');
    const installerProcess = child_process.spawn(installerCommand, installerArgs);

    installerProcess.stdout.on('data', (data: any) => {
        console.log(CATE_DESKTOP_PREFIX, `${data}`);
    });
    installerProcess.stderr.on('data', (data: any) => {
        console.error(CATE_DESKTOP_PREFIX, `${data}`);
    });
    installerProcess.on('error', (err: Error) => {
        console.log(CATE_DESKTOP_PREFIX, 'Cate backend installation failed', err);
        electron.dialog.showMessageBox({
            type: 'error',
            title: `${app.getName()} - Fatal Error`,
            message: 'Cate backend installation failed.',
            detail: `${err}`
        });
        app.exit(WEBAPI_INSTALLER_ERROR); // exit immediately
    });
    installerProcess.on('close', (code: number) => {
        console.log(CATE_DESKTOP_PREFIX, `Cate backend installation closed with exit code ${code}`);
        if (code == 0) {
            callback();
            return;
        }
        electron.dialog.showMessageBox({
            type: 'error',
            title: `${app.getName()} - Fatal Error`,
            message: `Cate backend installation failed with exit code ${code}.`,
        });
        app.exit(WEBAPI_INSTALLER_BAD_EXIT); // exit immediately
    });
    return installerProcess;
}
