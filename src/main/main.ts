import * as electron from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import * as child_process from 'child_process'
import {request} from './request';
import {assignConditionally} from '../common/assign';
import {Configuration} from "./configuration";
import {menuTemplate} from "./menu";
import {error} from "util";


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


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let _mainWindow;
let _splashWindow;
let _prefs: Configuration;
let _config: Configuration;

function getAppIconPath() {
    let icon_file = "cate-icon.png";
    if (process.platform === "darwin") {
        icon_file = "darwin/cate-icon.icns";
    } else if (process.platform === "win32") {
        icon_file = "win32/cate-icon.ico";
    }
    return path.join(app.getAppPath(), 'resources', icon_file);
}

function getAppDataDir() {
    return path.join(app.getPath('home'), '.cate');
}

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

function loadAppConfig(): Configuration {
    return loadConfiguration(CONFIG_OPTIONS, path.resolve('cate-config.js'), 'App configuration');
}

function getDefaultUserPrefsFile() {
    if (_config.data.prefsFile) {
        return _config.data.prefsFile;
    }
    return path.join(getAppDataDir(), 'cate-prefs.json');
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

function getWebAPIWebSocketsUrl(webAPIConfig) {
    return `ws://${webAPIConfig.serviceAddress || '127.0.0.1'}:${webAPIConfig.servicePort}/app`;
}

//noinspection JSUnusedGlobalSymbols
export function init() {

    _config = loadAppConfig();
    _prefs = loadUserPrefs();

    let webAPIConfig = _config.get('webAPIConfig', {});
    webAPIConfig = assignConditionally(webAPIConfig, {
        command: path.join(app.getAppPath(), process.platform === 'win32' ? 'python/Scripts/cate-webapi.exe' : 'python/bin/cate-webapi'),
        servicePort: 9090,
        serviceAddress: '',
        serviceFile: 'cate-webapi.json',
        // Refer to https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
        processOptions: {},
        useMockService: false,
    });

    _config.set('webAPIConfig', webAPIConfig);

    console.log(CATE_DESKTOP_PREFIX, 'appConfig:', _config.data);
    console.log(CATE_DESKTOP_PREFIX, 'userPrefs:', _prefs.data);

    let webAPIStarted = false;
    // Remember error occurred so
    let webAPIError = null;

    let webAPIProcess = null;

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    function startWebapiService(): child_process.ChildProcess {
        const webAPIStartArgs = getWebAPIStartArgs(webAPIConfig);
        console.log(CATE_WEBAPI_PREFIX, `starting Cate WebAPI service using arguments: ${webAPIStartArgs}`);
        const webAPIProcess = child_process.spawn(webAPIConfig.command, webAPIStartArgs, webAPIConfig.processOptions);
        webAPIStarted = true;
        webAPIProcess.stdout.on('data', (data: any) => {
            console.log(CATE_WEBAPI_PREFIX, `${data}`);
        });
        webAPIProcess.stderr.on('data', (data: any) => {
            console.error(CATE_WEBAPI_PREFIX, `${data}`);
        });
        webAPIProcess.on('error', (err: Error) => {
            let message = 'Failed to start Cate WebAPI service.';
            console.log(CATE_WEBAPI_PREFIX, message, err);
            if (!webAPIError) {
                electron.dialog.showErrorBox('Internal Error', message);
            }
            webAPIError = err;
            // exit immediately
            app.exit(1);
        });
        webAPIProcess.on('close', (code: number) => {
            let message = `Cate WebAPI service process exited with code ${code}.`;
            console.log(CATE_WEBAPI_PREFIX, message);
            if (code != 0) {
                if (!webAPIError) {
                    electron.dialog.showErrorBox('Internal Error', message);
                }
                webAPIError = new Error(message);
                // exit immediately
                app.exit(2);
            }
        });
        return webAPIProcess;
    }

    function stopWebapiService(webAPIProcess) {
        if (!webAPIProcess) {
            return;
        }
        // Note we are async here, because sync can take a lot of time...
        const webAPIStopArgs = getWebAPIStopArgs(webAPIConfig);
        child_process.spawn(webAPIConfig.command, webAPIStopArgs, webAPIConfig.processOptions);
        // child_process.spawnSync(webAPIConfig.command, webAPIStopArgs, webAPIConfig.options);
    }

    function startUpWithWebapiService() {
        const msServiceAccessTimeout = 1000; // ms
        const msServiceStartTimeout = 5000; // ms
        const msDelay = 500; // ms
        let msSpend = 0; // ms
        let webAPIRestUrl = getWebAPIRestUrl(_config.data.webAPIConfig);
        console.log(CATE_DESKTOP_PREFIX, `Waiting for response from ${webAPIRestUrl}`);
        request(webAPIRestUrl, msServiceAccessTimeout)
            .then((response: string) => {
                console.log(CATE_WEBAPI_PREFIX, `Response: ${response}`);
                createMainWindow();
            })
            .catch((err) => {
                console.log(CATE_DESKTOP_PREFIX, `No response within ${msServiceAccessTimeout} ms. Error: `, err);
                if (!webAPIStarted) {
                    webAPIProcess = startWebapiService();
                }
                if (msSpend > msServiceStartTimeout) {
                    let message = `Failed to start Cate WebAPI service within ${msSpend} ms.`;
                    console.error(CATE_WEBAPI_PREFIX, message, err);
                    if (!webAPIError) {
                        electron.dialog.showErrorBox("Internal Error", message);
                    }
                    webAPIError = new Error(message);
                    app.exit(2);
                } else {
                    setTimeout(startUpWithWebapiService, msDelay);
                    msSpend += msDelay;
                }
            });
    }

    app.on('ready', (): void => {
        createSplashWindow(null);

        console.log(CATE_DESKTOP_PREFIX, 'Ready.');
        if (!webAPIConfig.useMockService) {
            console.log(CATE_DESKTOP_PREFIX, 'Using Cate WebAPI service...');
            startUpWithWebapiService();
        } else {
            createMainWindow();
        }
    });

    // Emitted when all windows have been closed and the application will quit.
    app.on('quit', () => {
        console.log(CATE_DESKTOP_PREFIX, 'Quit.');
        if (!webAPIConfig.useMockService) {
            stopWebapiService(webAPIProcess);
        }
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
            // TODO (forman): must find out what Mac OS expects am app to do once it becomes deactivated
            //   - is it a complete reatrt or should it remain in its previous state?
            //   - must we stop the webapi on "deactivate" and start on "activate"?
            createMainWindow();
        }
    });

    // In this file you can include the rest of your app's specific main process
    // code. You can also put them in separate files and require them here.
}


function createSplashWindow(parent) {
    _splashWindow = new BrowserWindow({
        width: 256,
        height: 256,
        center: true,
        useContentSize: true,
        frame: false,
        alwaysOnTop: true,
        parent: parent,
        transparent: true,
    });
    _splashWindow.loadURL(url.format({
        pathname: path.join(app.getAppPath(), 'splash.html'),
        protocol: 'file:',
        slashes: true
    }));
    _splashWindow.on('closed', () => {
        _splashWindow = null
    });
}


function createMainWindow() {
    console.log(CATE_DESKTOP_PREFIX, 'Creating main window...');

    if (_config.data.devToolsExtensions) {
        for (let path of _config.data.devToolsExtensions) {
            BrowserWindow.addDevToolsExtension(path);
            console.log(CATE_DESKTOP_PREFIX, `Added DevTools extension "${path}"`);
        }
    }

    const mainWindowBounds = _prefs.data.mainWindowBounds || {width: 800, height: 600};

    _mainWindow = new BrowserWindow(Object.assign({icon: getAppIconPath(), webPreferences: {}}, mainWindowBounds));

    console.log(CATE_DESKTOP_PREFIX, 'Loading app menu...');
    const menu = electron.Menu.buildFromTemplate(menuTemplate);
    electron.Menu.setApplicationMenu(menu);

    console.log(CATE_DESKTOP_PREFIX, 'Loading main window UI...');
    _mainWindow.loadURL(url.format({
        pathname: path.join(app.getAppPath(), 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    _mainWindow.webContents.on('did-finish-load', () => {
        console.log(CATE_DESKTOP_PREFIX, 'Main window UI loaded.');
        if (_splashWindow) {
            _splashWindow.close();

            const webAPIConfig = _config.data.webAPIConfig;
            _mainWindow.webContents.send('apply-initial-state', {
                session: _prefs.data,
                appConfig: Object.assign({}, _config.data, {
                    appPath: app.getAppPath(),
                    webAPIConfig: Object.assign({}, webAPIConfig, {
                        restUrl: getWebAPIRestUrl(webAPIConfig),
                        webSocketUrl: getWebAPIWebSocketsUrl(webAPIConfig),
                    }),
                })
            });
        }
    });

    if (_config.data.devToolsOpened) {
        // Open the DevTools.
        _mainWindow.webContents.openDevTools();
    }

    // Emitted when the web page has been rendered and window can be displayed without a visual flash.
    _mainWindow.on('ready-to-show', () => {
        console.log(CATE_DESKTOP_PREFIX, 'Main window is ready to show.');
    });

    // Emitted when the window is going to be closed.
    _mainWindow.on('close', () => {
        console.log(CATE_DESKTOP_PREFIX, 'Main window is going to be closed, fetching user preferences...');
        _prefs.set('mainWindowBounds', _mainWindow.getBounds());
        _prefs.set('devToolsOpened', _mainWindow.webContents.isDevToolsOpened());
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
        dialog.showMessageBox(_mainWindow, messageBoxOptions, (index: number) => {
            // console.log('show-message-box: index =', index);
            if (synchronous) {
                event.returnValue = index;
            } else {
                event.sender.send('show-message-box-reply', index);
            }
        });
    });

    ipcMain.on('store-preferences', (event, preferences) => {
        _prefs.setAll(preferences);
        storeUserPrefs(_prefs);
    });
}




