import * as electron from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import * as child_process from 'child_process'
import {request} from './request';
import {assignConditionally } from '../common/assign';
import {Configuration} from "./configuration";
import {menuTemplate} from "./menu";


const PREFS_OPTIONS = ['--prefs', '-p'];
const CONFIG_OPTIONS = ['--config', '-c'];
const CATE_WEBAPI_PREFIX = 'cate-webapi:';
const CATE_DESKTOP_PREFIX = 'cate-desktop:';

// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let _mainWindow;
let _prefs;
let _config;

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

export function init() {
    _config = loadAppConfig();
    _prefs = loadUserPrefs();

    let webapiConfig = _config.get('webapiConfig', {});
    webapiConfig = assignConditionally(webapiConfig, {
        command: path.join(app.getAppPath(), process.platform == 'windows' ? 'python/Scripts/cate-webapi.exe' : 'python/bin/cate-webapi'),
        servicePort: 9090,
        serviceFile: 'cate-webapi.json',
        // Refer to https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
        processOptions: {},
        // TODO: set disabled=false in production mode later
        disabled: true,
    });

    console.log(CATE_DESKTOP_PREFIX, 'webapiConfig =', webapiConfig);

    const webapiCommonArgs = [
        '--caller', 'cate-desktop',
        '--port', webapiConfig.servicePort,
        '--file', webapiConfig.serviceFile,
    ];

    const webapiStartArgs = webapiCommonArgs.concat('start');
    const webapiStopArgs = webapiCommonArgs.concat('stop');
    const webapiBaseUrl = `http://localhost:${webapiConfig.servicePort}/`;

    let webapiStarted = false;
    // Remember error occurred so
    let webapiError = null;

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    function startWebapiService(): child_process.ChildProcess {
        const webapi = child_process.spawn(webapiConfig.command, webapiStartArgs, webapiConfig.processOptions);
        webapiStarted = true;
        webapi.stdout.on('data', (data: any) => {
            console.log(CATE_WEBAPI_PREFIX, `${data}`);
        });
        webapi.stderr.on('data', (data: any) => {
            console.error(CATE_WEBAPI_PREFIX, `${data}`);
        });
        webapi.on('error', (err: Error) => {
            let message = 'Failed to start Cate service.';
            console.log(CATE_WEBAPI_PREFIX, message, err);
            if (!webapiError) {
                electron.dialog.showErrorBox('Internal Error', message);
            }
            webapiError = err;
            // exit immediately
            app.exit(1);
        });
        webapi.on('close', (code: number) => {
            let message = `Cate service exited with error code ${code}.`;
            console.log(CATE_WEBAPI_PREFIX, message);
            if (code != 0) {
                if (!webapiError) {
                    electron.dialog.showErrorBox('Internal Error', message);
                }
                webapiError = new Error(message);
                // exit immediately
                app.exit(2);
            }
        });
        return webapi;
    }

    function stopWebapiService() {
        // Note we are async here, because sync can take a lot of time...
        child_process.spawn(webapiConfig.command, webapiStopArgs, webapiConfig.processOptions);
        // child_process.spawnSync(webapiConfig.command, webapiStopArgs, webapiConfig.options);
    }

    function startUpWithWebapiService() {
        const msTimeout = 5000; // ms
        const msDelay = 500; // ms
        let msSpend = 0; // ms
        request(webapiBaseUrl)
            .then((response: string) => {
                console.log(CATE_WEBAPI_PREFIX, `resonse: ${response}`);
                createMainWindow();
            })
            .catch((err) => {
                if (!webapiStarted) {
                    startWebapiService();
                }
                if (msSpend > msTimeout) {
                    let message = `Failed to start Cate service within ${msSpend} ms.`;
                    console.error(CATE_WEBAPI_PREFIX, message, err);
                    if (!webapiError) {
                        electron.dialog.showErrorBox("Internal Error", message);
                    }
                    webapiError = new Error(message);
                    app.exit(2);
                } else {
                    setTimeout(startUpWithWebapiService, msDelay);
                    msSpend += msDelay;
                }
            });
    }

    app.on('ready', (): void => {
        console.log(CATE_DESKTOP_PREFIX, 'Ready.');
        if (!webapiConfig.disabled) {
            console.log(CATE_DESKTOP_PREFIX, 'Starting Cate service...');
            startUpWithWebapiService();
        } else {
            createMainWindow();
        }
    });

    // Emitted when all windows have been closed and the application will quit.
    app.on('quit', () => {
        console.log(CATE_DESKTOP_PREFIX, 'Quit.');
        if (!webapiConfig.disabled) {
            stopWebapiService();
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
            // TODO: must find out what Mac OS expects am app to do once it becomes deactivated
            //   - is it a complete reatrt or should it remain in its previous state?
            //   - must we stop the webapi on "deactivate" and start on "activate"?
            createMainWindow();
        }
    });

    // In this file you can include the rest of your app's specific main process
    // code. You can also put them in separate files and require them here.
}

function createMainWindow() {

    if (_config.data.devToolsExtensions) {
        for (let path of _config.data.devToolsExtensions) {
            BrowserWindow.addDevToolsExtension(path);
            console.log(CATE_DESKTOP_PREFIX, `Added DevTools extension "${path}"`);
        }
    }

    const mainWindowBounds = _prefs.data.mainWindowBounds || {width: 800, height: 600};

    _mainWindow = new BrowserWindow(Object.assign({icon: getAppIconPath(), webPreferences: {}}, mainWindowBounds));

    console.log(CATE_DESKTOP_PREFIX, 'Loading menu...');
    const menu = electron.Menu.buildFromTemplate(menuTemplate);
    electron.Menu.setApplicationMenu(menu);

    console.log(CATE_DESKTOP_PREFIX, 'Loading UI...');
    _mainWindow.loadURL(url.format({
        pathname: path.join(app.getAppPath(), 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

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
}

