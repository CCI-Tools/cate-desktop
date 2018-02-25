import * as electron from 'electron';
import installDevToolsExtension from 'electron-devtools-installer';
import * as devTools from 'electron-devtools-installer';
import * as log from "electron-log";
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import * as child_process from 'child_process'
import {request} from './request';
import {updateConditionally} from '../common/objutil';
import {Configuration} from "./configuration";
import {menuTemplate} from "./menu";
import {error, isNumber} from "util";
import {
    getAppDataDir, getAppIconPath,
    getCateCliSetupInfo, setCateDir, getCateCliPath, getCateCliVersion
} from "./appenv";
import * as net from "net";
import {installAutoUpdate} from "./update-frontend";
import {isDefined} from "../common/types";
import {doSetup} from "./setup";
import {SetupResult} from "../common/setup";

const PREFS_OPTIONS = ['--prefs', '-p'];
const CONFIG_OPTIONS = ['--config', '-c'];
const RUN_OPTIONS = [ '--run', '-r'];

const CATE_WEBAPI_PREFIX = 'cate-webapi:';

// Module to control application life.
const app = electron.app;

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const ipcMain = electron.ipcMain;
const dialog = electron.dialog;

const WEBAPI_INTERNAL_ERROR = 1;
const WEBAPI_TIMEOUT = 2;
const WEBAPI_NO_FREE_PORT = 4;
const WEBAPI_BAD_EXIT = 1000;


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let _mainWindow;
let _splashWindow;

/**
 * Preferences loaded from $home/.cate/preferences.json
 * Note: all preferences set by the main process (the process executing this module)
 * must be protected from overwriting by the renderer process!
 * See src/renderer/actions.ts, function sendPreferencesToMain()
 */
let _prefs: Configuration;

/**
 * Configuration loaded from $(pwd)/cate-config.js
 */
let _config: Configuration;

/**
 * _prefsUpdateRequestedOnClose is used to indicate that we are waiting for a preferences update from the
 * renderer process.
 *
 * @type {boolean}
 * @private
 */
let _prefsUpdateRequestedOnClose = false;

/**
 * _prefsUpdatedOnClose is used to indicate that we have received a preferences update from the
 * renderer process and we now can safely close.
 *
 * @type {boolean}
 * @private
 */
let _prefsUpdatedOnClose = false;


function getOptionArg(options: string[]): string | null {
    let args: Array<string> = process.argv.slice(1);
    for (let i = 0; i < args.length; i++) {
        if (options.indexOf(args[i]) >= 0 && i < args.length - 1) {
            return args[i + 1];
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
            log.error(`${configType} could not be loaded from "${configFile}"`, err);
        } else {
            log.info(`${configType} successfully loaded from "${configFile}"`);
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
            log.error(`${configType} could not be stored in "${configFile}"`, err);
        } else {
            log.info(`${configType} successfully stored in "${configFile}"`);
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
    return path.join(getAppDataDir(), 'preferences.json');
}

function storeUserPrefs(prefs: Configuration) {
    storeConfiguration(prefs, PREFS_OPTIONS, getDefaultUserPrefsFile(), 'User preferences')
}

function loadUserPrefs(): Configuration {
    return loadConfiguration(PREFS_OPTIONS, getDefaultUserPrefsFile(), 'User preferences');
}


function getWebAPICommonArgs(webAPIConfig) {
    const webApiExe = process.platform === 'win32' ? 'cate-webapi.exe' : 'cate-webapi';
    let args = [
        webApiExe,
        '--caller', 'cate-desktop',
        '--port', webAPIConfig.servicePort,
        '--file', webAPIConfig.serviceFile,
    ];
    if (webAPIConfig.serviceAddress) {
        args = args.concat('--address', webAPIConfig.serviceAddress);
    }
    return args;
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

function logCateVersion() {
    getCateCliVersion().then(version => {
        log.info("cate-cli version: ", version);
    }).catch(err => {
        log.error("failed to get cate-cli version: ", err);
    });
}

// noinspection JSUnusedGlobalSymbols
export function init() {

    // Configure logging
    log.transports.file.level = 'info';

    /**
     * We use the '--run' option to execute modules in electron / node environment.
     *
     * @type {string | null}
     */
    let modulePath = getOptionArg(RUN_OPTIONS);
    if (modulePath) {
        try {
            const module = require(modulePath);
            const exitCode = module.run();
            if (exitCode === 0) {
                return;
            } else if (isNumber(exitCode)) {
                process.exit(exitCode);
            }
        } catch (e) {
            log.error(e);
            process.exit(1);
        }
    }

    log.info("process.versions =", process.versions);

    if (process.platform === 'darwin') {
        // Try getting around https://github.com/CCI-Tools/cate-desktop/issues/32
        // See https://electron.atom.io/docs/api/app/#appcommandlineappendswitchswitch-value
        // See https://bugs.chromium.org/p/chromium/issues/detail?id=682075&desc=2
        app.commandLine.appendSwitch('disable_chromium_framebuffer_multisample');
        app.commandLine.appendSwitch('disable_depth_texture');
    }

    _config = loadAppConfig();
    _prefs = loadUserPrefs();

    // By default NODE_ENV will be 'production' so react is much faster
    process.env.NODE_ENV = _config.get('NODE_ENV', 'production');
    log.info('process.env.NODE_ENV = ' + process.env.NODE_ENV);

    let webAPIConfig = _config.get('webAPIConfig', {});
    webAPIConfig = updateConditionally(webAPIConfig, {
        servicePort: 9090,
        serviceAddress: '',
        serviceFile: path.join(getAppDataDir(), 'webapi-info.json'),
        // Refer to https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
        processOptions: {},
    });
    _config.set('webAPIConfig', webAPIConfig);

    log.info('appPath:', app.getAppPath());
    log.info('appConfig:', _config.data);
    //log.info('userPrefs:', _prefs.data);

    let webAPIError = null;
    let webAPIProcess = null;

    const processOptions = {
        //detached: false,
        //stdio: 'inherit',
        ...webAPIConfig.processOptions
    };

    function ensureValidCateCliDir(callback: () => void) {
        const setupInfo = getCateCliSetupInfo();
        log.info("setupInfo: ", setupInfo);
        if (setupInfo.setupReason) {
            if (!_splashWindow.isDestroyed() && _splashWindow.isVisible()) {
                _splashWindow.hide();
            }
            doSetup(setupInfo, (setupResult: SetupResult) => {
                log.info("After setup: setupResult =", setupResult);
                if (setupResult) {
                    const {cateDir, cateVersion} = setupResult;
                    setCateDir(cateDir);
                    if (!_splashWindow.isDestroyed()) {
                        _splashWindow.show();
                    }
                    const locationFile = path.join(getAppDataDir(), cateVersion, "cate.location");
                    log.warn("Writing ", locationFile);
                    fs.writeFile(locationFile, cateDir, {encoding: 'utf8'}, err => {
                        if (!err) {
                            callback();
                        } else {
                            log.error("Writing failed: ", err);
                            electron.dialog.showErrorBox(`${app.getName()} - Error`,
                                                         `Writing to ${locationFile} failed:\n${err}`);
                        }
                    });
                } else {
                    app.exit(0);
                }
            });
        } else {
            setCateDir(setupInfo.oldCateDir);
            callback();
        }
    }

    function startWebAPIService(callback: (process: child_process.ChildProcess) => void) {
        logCateVersion();

        const cateCliPath = getCateCliPath();
        showSplashMessage('Searching unused port...');
        findFreePort(webAPIConfig.servicePort, null, (freePort: number) => {
            if (freePort < webAPIConfig.servicePort) {
                log.error("Can't find any free port");
                electron.dialog.showErrorBox(`${app.getName()} - Error`, "Can't find any free port");
                app.exit(WEBAPI_NO_FREE_PORT);
                return;
            }
            if (freePort !== webAPIConfig.servicePort) {
                log.warn(`Cate has been configured to use port ${webAPIConfig.servicePort}, but next free port is ${freePort}`);
            }
            webAPIConfig.servicePort = freePort;

            const webAPIStartArgs = getWebAPIStartArgs(webAPIConfig);
            log.info(`Starting Cate service: ${cateCliPath} [${webAPIStartArgs}]`);

            webAPIProcess = child_process.spawn(cateCliPath, webAPIStartArgs, processOptions);
            log.info('Cate service started.');
            webAPIProcess.stdout.on('data', (data: any) => {
                log.info(CATE_WEBAPI_PREFIX, `${data}`);
            });
            webAPIProcess.stderr.on('data', (data: any) => {
                log.error(CATE_WEBAPI_PREFIX, `${data}`);
            });
            webAPIProcess.on('error', (err: Error) => {
                log.error(CATE_WEBAPI_PREFIX, err);
                if (!webAPIError) {
                    electron.dialog.showErrorBox(`${app.getName()} - Internal Error`,
                                                 'Failed to start Cate service.');
                }
                webAPIError = err;
                app.exit(WEBAPI_INTERNAL_ERROR); // exit immediately
            });
            webAPIProcess.on('close', (code: number) => {
                let message = `Cate service process exited with code ${code}.`;
                log.log(CATE_WEBAPI_PREFIX, message);
                if (code !== 0) {
                    if (!webAPIError) {
                        electron.dialog.showErrorBox(`${app.getName()} - Internal Error`, message);
                    }
                    webAPIError = new Error(message);
                    app.exit(WEBAPI_BAD_EXIT + code); // exit immediately
                }
            });

            callback(webAPIProcess);
        });
    }

    function stopWebAPIService(webAPIProcess) {
        // If there is no webAPIProcess instance, we haven't started the WebAPI service on our own.
        if (!webAPIProcess) {
            return;
        }
        const cateCliPath = getCateCliPath();
        const webAPIStopArgs = getWebAPIStopArgs(webAPIConfig);
        log.info(`Stopping Cate service using arguments: ${webAPIStopArgs}`);
        // this must be sync to make sure the stop is performed before this process ends
        child_process.spawnSync(cateCliPath, webAPIStopArgs, webAPIConfig.options);
    }

    const msServiceAccessTimeout = 1000; // ms
    const msServiceStartTimeout = 5000; // ms
    const msDelay = 500; // ms
    let msSpend = 0; // ms
    let webAPIRestUrl = getWebAPIRestUrl(webAPIConfig);

    function startUpWithWebAPIService() {
        log.info(`Waiting for response from Cate service ${webAPIRestUrl}`);
        showSplashMessage('Waiting for Cate service response...');
        request(webAPIRestUrl, msServiceAccessTimeout)
            .then((response: string) => {
                log.info(CATE_WEBAPI_PREFIX, response);
                loadMainWindow();
            })
            .catch((err) => {
                log.info(`No response from Cate service after ${msSpend} ms`);
                let callback = () => {
                    if (msSpend > msServiceStartTimeout) {
                        log.error(`Failed to start Cate service within ${msSpend} ms.`, err);
                        if (!webAPIError) {
                            electron.dialog.showErrorBox(`${app.getName()} - Internal Error`, `Failed to start Cate service within ${msSpend} ms.`);
                        }
                        app.exit(WEBAPI_TIMEOUT);
                    } else {
                        setTimeout(startUpWithWebAPIService, msDelay);
                        msSpend += msDelay;
                    }
                };
                if (!webAPIProcess) {
                    ensureValidCateCliDir(() => startWebAPIService(callback));
                } else {
                    callback();
                }
            });
    }

    function initBrowserWindows() {

        const mainWindowBounds = _prefs.data.mainWindowBounds || {width: 1366, height: 768};
        _mainWindow = new BrowserWindow({
                                            icon: getAppIconPath(),
                                            title: `${app.getName()} ${app.getVersion()}`,
                                            show: false,
                                            ...mainWindowBounds
                                        });

        _mainWindow.once('ready-to-show', () => {
            log.info('Ready to show.');
            _mainWindow.show();
        });

        _splashWindow = new BrowserWindow({
                                              width: 830,
                                              height: 320,
                                              center: true,
                                              show: true,
                                              useContentSize: true,
                                              frame: false,
                                              alwaysOnTop: false,
                                              transparent: true,
                                              parent: _mainWindow
                                          });
    }

    const shouldQuit = app.makeSingleInstance(() => {
        // Someone tried to run a second instance, we should focus our window.
        if (_mainWindow) {
            if (_mainWindow.isMinimized()) {
                _mainWindow.restore();
            }
            _mainWindow.focus();
        }
    });
    if (shouldQuit) {
        app.quit();
        return;
    }

    // Emitted when Electron has finished initializing.
    app.on('ready', (): void => {
        initBrowserWindows();
        loadSplashWindow(() => {
            log.info('Ready.');
            startUpWithWebAPIService();
        });
    });

    // Emitted when all windows have been closed and the application will quit.
    app.on('quit', () => {
        log.info('Quit.');
        stopWebAPIService(webAPIProcess);
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
            loadMainWindow();
        }
    });

    if (process.env.NODE_ENV !== 'development') {
        const autoUpdateSoftware = _prefs.data.autoUpdateSoftware || !isDefined(_prefs.data.autoUpdateSoftware);
        if (autoUpdateSoftware) {
            installAutoUpdate();
        }
    }
}

function loadSplashWindow(callback: () => void) {
    _splashWindow.loadURL(url.format({
                                         pathname: path.join(app.getAppPath(), 'splash.html'),
                                         protocol: 'file:',
                                         slashes: true
                                     }));
    _splashWindow.webContents.on('did-finish-load', callback);
}

function showSplashMessage(message: string) {
    log.info('Splash says:', message);
    if (_splashWindow && !_splashWindow.isDestroyed() && _splashWindow.isVisible()) {
        _splashWindow.webContents.send('update-splash-message', message);
    } else {
        log.warn('showSplashMessage: splash not visible', message);
    }
}

function loadMainWindow() {

    if (_config.data.devToolsExtensions) {
        showSplashMessage('Installing developer tools...');
        for (let devToolsExtensionName of _config.data.devToolsExtensions) {
            const devToolExtension = devTools[devToolsExtensionName];
            if (devToolExtension) {
                installDevToolsExtension(devToolExtension)
                    .then(() => log.info(`Added DevTools extension "${devToolsExtensionName}"`))
                    .catch((err) => log.error('Failed to add DevTools extension: ', err));
            }
        }
    }

    showSplashMessage('Loading user interface...');

    const menu = electron.Menu.buildFromTemplate(menuTemplate);
    electron.Menu.setApplicationMenu(menu);

    _mainWindow.loadURL(url.format({
                                       pathname: path.join(app.getAppPath(), 'index.html'),
                                       protocol: 'file:',
                                       slashes: true
                                   }));

    _mainWindow.webContents.on('did-finish-load', () => {
        showSplashMessage('Done.');
        if (_splashWindow && !_splashWindow.isDestroyed()) {
            _splashWindow.close();
        }
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
    });

    if (_prefs.data.devToolsOpened) {
        // Open the DevTools.
        _mainWindow.webContents.openDevTools();
    }

    const requestPreferencesUpdate = (event) => {
        _prefsUpdateRequestedOnClose = true;
        log.info('Main window is going to be closed, fetching user preferences...');
        _prefs.set('mainWindowBounds', _mainWindow.getBounds());
        _prefs.set('devToolsOpened', _mainWindow.webContents.isDevToolsOpened());
        event.sender.send('get-preferences');
    };

    // Emitted when the window is going to be closed.
    _mainWindow.on('close', (event) => {
        if (!_prefsUpdateRequestedOnClose) {
            const EXIT = process.platform === 'darwin' ? 'Quit' : 'Exit';
            event.preventDefault();
            const suppressExitConfirm = _prefs.get('suppressExitConfirm', false);
            if (!suppressExitConfirm) {
                const options = {
                    type: 'question',
                    title: `${app.getName()} - Confirm ${EXIT}`,
                    buttons: ['Cancel', EXIT],
                    //buttons: ['Cancel', "Yes"],
                    cancelId: 0,
                    message: `Are you sure you want to exit ${app.getName()}?`,
                    checkboxLabel: 'Do not ask me again',
                    checkboxChecked: false,
                };
                const callback = (response: number, checkboxChecked: boolean) => {
                    _prefs.set('suppressExitConfirm', checkboxChecked);
                    const exitConfirmed = response === 1;
                    if (exitConfirmed) {
                        requestPreferencesUpdate(event);
                        app.quit();
                    }
                };
                electron.dialog.showMessageBox(_mainWindow, options, callback);
            } else {
                requestPreferencesUpdate(event);
            }
        } else if (!_prefsUpdatedOnClose) {
            event.preventDefault();
            log.info('Main window is going to be closed, must still update preferences...');
        } else {
            log.info('Main window is going to be closed, nothing more to do...');
        }
    });

    // Emitted when the window is closed.
    _mainWindow.on('closed', () => {
        log.info('Main window closed.');
        storeUserPrefs(_prefs);
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        _mainWindow = null;
    });

    ipcMain.on('show-open-dialog', (event, openDialogOptions, synchronous?: boolean) => {
        dialog.showOpenDialog(_mainWindow, openDialogOptions, (filePaths: Array<string>) => {
            if (synchronous) {
                event.returnValue = filePaths && filePaths.length ? filePaths : null;
            } else {
                event.sender.send('show-open-dialog-reply', filePaths);
            }
        });
    });

    ipcMain.on('show-save-dialog', (event, saveDialogOptions, synchronous?: boolean) => {
        dialog.showSaveDialog(_mainWindow, saveDialogOptions, (filePath: string) => {
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


function findFreePort(fromPort?: number, toPort?: number, callback?: (port: number) => void) {
    fromPort = fromPort || 49152;
    toPort = toPort || 65535;

    const findPort = (port: number) => {
        const server = net.createServer();
        server.listen(port, () => {
            server.once('close', () => {
                callback(port);
            });
            server.close();
        });
        server.on('error', () => {
            if (port < toPort) {
                findPort(port + 1);
            } else {
                callback(-1);
            }
        });
    };

    findPort(fromPort);
}


