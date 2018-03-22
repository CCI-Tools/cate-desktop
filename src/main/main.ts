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
import {
    getAppDataDir, getAppIconPath,
    getCateCliSetupInfo, setCateDir, getWebAPIStartCommand, getWebAPIRestUrl,
    getWebAPIStopCommand, getMPLWebSocketsUrl, getAPIWebSocketsUrl, defaultSpawnShellOption, getHomeName
} from "./appenv";
import * as net from "net";
import {installAutoUpdate} from "./update-frontend";
import {isDefined, isNumber} from "../common/types";
import {doSetup} from "./setup";
import {SetupResult} from "../common/setup";

const PREFS_OPTIONS = ['--prefs', '-p'];
const CONFIG_OPTIONS = ['--config', '-c'];
const RUN_OPTIONS = ['--run', '-r'];

const WEBAPI_LOG_PREFIX = 'cate-webapi:';

const ERRCODE_WEBAPI_INTERNAL_ERROR = 1;
const ERRCODE_WEBAPI_TIMEOUT = 2;
const ERRCODE_WEBAPI_NO_FREE_PORT = 3;
const ERRCODE_SETUP_FAILED = 5;

// Timeout for starting WebAPI in seconds.
// See https://github.com/CCI-Tools/cate/issues/550
const WEBAPI_START_TIMEOUT_MAX = 60;

// Timeout for stopping WebAPI in seconds.
const WEBAPI_STOP_TIMEOUT_MAX = 2.5;

// WebAPI access timeout in seconds:
const WEBAPI_ACCESS_TIMEOUT_MAX = 0.5;

// Delay between two WebAPI accesses in seconds:
const WEBAPI_ACCESS_DELAY_MAX = 0.5;

// Signal used to kill a running WebAPI service if a stop requiest times out:
const WEBAPI_KILL_SIGNAL = "SIGKILL";


const NANOS_PER_SEC = 1.0e9;

// Global, so it will not be garbage collected.
let app;

// noinspection JSUnusedGlobalSymbols
export function init() {
    app = new CateDesktopApp();
    app.start();
}

class CateDesktopApp {

    /**
     * Preferences loaded from $home/.cate/preferences.json
     * Note: all preferences set by the main process (the process executing this module)
     * must be protected from overwriting by the renderer process!
     * See src/renderer/actions.ts, function sendPreferencesToMain()
     */
    private preferences: Configuration = null;

    /**
     * Configuration loaded from $(pwd)/cate-config.js
     */
    private configuration: Configuration = null;

    private webAPIProcess: child_process.ChildProcess = null;

    private webAPIError = null;

    private webAPIStartTime = null;

    // Keep a global reference of window objects, if you don't, the windows will
    // be closed automatically when the JavaScript object is garbage collected.
    private mainWindow: electron.BrowserWindow = null;
    private splashWindow: electron.BrowserWindow = null;

    private quitRequested = false;
    private quitConfirmed = false;

    get webAPIConfig(): any {
        return this.configuration.get('webAPIConfig');
    }

    get webAPIProcessOptions(): any {
        return {...this.webAPIConfig.processOptions, ...defaultSpawnShellOption()};
    }

    get webAPIRestUrl(): string {
        return getWebAPIRestUrl(this.webAPIConfig);
    }

    get webAPIStartTimeout(): number {
        return this.preferences.get("webAPIStartTimeout", WEBAPI_START_TIMEOUT_MAX);
    }

    get webAPIStopTimeout(): number {
        return this.preferences.get("webAPIStopTimeout", WEBAPI_STOP_TIMEOUT_MAX);
    }

    get webAPIAccessTimeout(): number {
        return this.preferences.get("webAPIAccessTimeout", WEBAPI_ACCESS_TIMEOUT_MAX);
    }

    get webAPIAccessDelay(): number {
        return this.preferences.get("webAPIAccessDelay", WEBAPI_ACCESS_DELAY_MAX);
    }

    get webAPIStartTimeDelta(): number {
        const delta = process.hrtime(this.webAPIStartTime);
        return delta[0] + delta[1] / NANOS_PER_SEC;
    }

    get webAPIKillSignal(): string {
        return this.preferences.get("webAPIKillSignal", WEBAPI_KILL_SIGNAL);
    }

    start() {
        // Ensure we have a valid "~/.cate/"
        if (!CateDesktopApp.ensureAppDataDir()) {
            return;
        }

        // We can use the '--run' option to execute modules in electron / node environment.
        if (this.maybeRunModule()) {
            return;
        }

        // Configure logging
        log.transports.file.level = 'info';
        log.transports.file.file = path.join(getAppDataDir(), 'cate-desktop.log');
        log.info("process.versions =", process.versions);

        if (process.platform === 'darwin') {
            // Try getting around https://github.com/CCI-Tools/cate-desktop/issues/32
            // See https://electron.atom.io/docs/api/app/#appcommandlineappendswitchswitch-value
            // See https://bugs.chromium.org/p/chromium/issues/detail?id=682075&desc=2
            electron.app.commandLine.appendSwitch('disable_chromium_framebuffer_multisample');
            electron.app.commandLine.appendSwitch('disable_depth_texture');
        }

        this.initUserConfiguration();
        this.initUserPreferences();

        // log.info(this.preferences.data);

        // By default NODE_ENV will be 'production' so react is much faster
        process.env.NODE_ENV = this.configuration.get('NODE_ENV', 'production');
        log.info('process.env.NODE_ENV = ' + process.env.NODE_ENV);

        this.initWebAPIConfig();

        log.info('appPath:', electron.app.getAppPath());
        log.info('appConfig:', this.configuration.data);

        // Emitted when Electron has finished initializing.
        electron.app.on('ready', (): void => {
            log.info('Ready.');
            this.initMainWindow();
            this.showSplashWindow(() => {
                this.startUpWithWebAPIService();
            });
        });

        // Emitted before the application starts closing its windows.
        electron.app.on('before-quit', () => {
            this.quitRequested = true;
        });

        // Emitted when all windows have been closed and the application will quit.
        electron.app.on('quit', () => {
            log.info('Quit.');
            this.stopWebAPIService();
        });

        const shouldQuit = electron.app.makeSingleInstance(() => {
            // Someone tried to run a second instance, we should focus our window.
            if (this.mainWindow) {
                if (this.mainWindow.isMinimized()) {
                    this.mainWindow.restore();
                }
                this.mainWindow.focus();
            }
        });
        if (shouldQuit) {
            electron.app.quit();
            return;
        }

        electron.ipcMain.on('show-open-dialog', (event, openDialogOptions, synchronous?: boolean) => {
            electron.dialog.showOpenDialog(this.mainWindow, openDialogOptions, (filePaths: Array<string>) => {
                if (synchronous) {
                    event.returnValue = filePaths && filePaths.length ? filePaths : null;
                } else {
                    event.sender.send('show-open-dialog-reply', filePaths);
                }
            });
        });

        electron.ipcMain.on('show-save-dialog', (event, saveDialogOptions, synchronous?: boolean) => {
            electron.dialog.showSaveDialog(this.mainWindow, saveDialogOptions, (filePath: string) => {
                if (synchronous) {
                    event.returnValue = filePath ? filePath : null;
                } else {
                    event.sender.send('show-save-dialog-reply', filePath);
                }
            });
        });

        electron.ipcMain.on('show-message-box', (event, messageBoxOptions, synchronous?: boolean) => {
            let reportingEnabled = false;
            if (!messageBoxOptions.checkboxLabel && messageBoxOptions.detail && messageBoxOptions.type === 'error') {
                messageBoxOptions = {
                    ...messageBoxOptions,
                    checkboxLabel: 'Copy report to clipboard',
                    checkboxChecked: false,
                };
                reportingEnabled = true;
            }
            electron.dialog.showMessageBox(this.mainWindow, messageBoxOptions, (buttonIndex: number, checkboxChecked: boolean) => {
                if (reportingEnabled && checkboxChecked) {
                    const reportEntries = [
                        electron.app.getName() + ', version ' + electron.app.getVersion(),
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

        electron.ipcMain.on('set-preferences', (event, preferences) => {
            log.info('Received user preferences update from UI...');
            this.preferences.setAll(preferences);
            try {
                this.storeUserPreferences();
            } catch (err) {
                event.sender.send('set-preferences-reply', err.toString());
            }
        });
    }

    private requestPreferencesUpdate() {
        log.info('Requesting user preferences update from UI...');
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            // Ask the UI to send its current state, so we can update preferences.
            // This will respond with on 'set-preferences' channel
            this.mainWindow.webContents.send('get-preferences');
        }
    }

    private initWebAPIConfig() {
        let webAPIConfig = this.configuration.get('webAPIConfig', {});
        webAPIConfig = updateConditionally(webAPIConfig, {
            servicePort: 9090,
            serviceAddress: '',
            serviceFile: path.join(getAppDataDir(), 'webapi-info.json'),
            // Refer to https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
            processOptions: {},
        });
        this.configuration.set('webAPIConfig', webAPIConfig);
    }

    private startUpWithWebAPIService() {
        if (this.webAPIStartTime === null) {
            // Set start time, unless it has already been done
            this.resetWebAPIStartTime();
            this.showSplashMessage('Waiting for Cate service...');
        }

        log.info(`Waiting for response from Cate service ${this.webAPIRestUrl}`);
        request(this.webAPIRestUrl, this.webAPIAccessTimeout)
            .then((response: string) => {
                log.info('Connected to Cate service. Response: ', response);
                this.loadMainWindow();
            })
            .catch((err) => {
                const delta = this.webAPIStartTimeDelta;
                const deltaStr = delta.toFixed(2);
                log.info(`No response from Cate service after ${deltaStr} seconds: ${err}`);
                this.showSplashMessage(`Waiting for Cate service (${deltaStr}s)`);
                let callback = () => {
                    if (delta > this.webAPIStartTimeout) {
                        log.error(`Failed to start Cate service within ${deltaStr} seconds.`, err);
                        if (!this.webAPIError) {
                            electron.dialog.showErrorBox(`${electron.app.getName()} - Internal Error`,
                                                         `Failed to start Cate service within ${deltaStr} seconds:\n${err}`);
                        }
                        electron.app.exit(ERRCODE_WEBAPI_TIMEOUT);
                    } else {
                        setTimeout(this.startUpWithWebAPIService.bind(this), 1000 * this.webAPIAccessDelay);
                    }
                };
                if (!this.webAPIProcess) {
                    this.ensureCateDir((setupPerformed: boolean) => {
                        if (setupPerformed) {
                            // We may have spend considerable time in the setup dialog, so reset the start time.
                            this.resetWebAPIStartTime();
                        }
                        this.startWebAPIService(callback)
                    });
                } else {
                    callback();
                }
            });
    }

    private startWebAPIService(callback: () => void) {

        this.showSplashMessage('Searching unused port...');
        findFreePort(this.webAPIConfig.servicePort, null, (freePort: number) => {
            if (freePort < this.webAPIConfig.servicePort) {
                log.error("Can't find any free port");
                electron.dialog.showErrorBox(`${electron.app.getName()} - Error`, "Can't find any free port");
                electron.app.exit(ERRCODE_WEBAPI_NO_FREE_PORT);
                return;
            }
            if (freePort !== this.webAPIConfig.servicePort) {
                log.warn(`Cate has been configured to use port ${this.webAPIConfig.servicePort}, but next free port is ${freePort}`);
            }
            this.webAPIConfig.servicePort = freePort;

            const webAPIStartCommand = getWebAPIStartCommand(this.webAPIConfig);
            log.info(`Starting Cate service: ${webAPIStartCommand}`);
            this.webAPIProcess = child_process.spawn(webAPIStartCommand, [], this.webAPIProcessOptions);
            log.info(`Cate service started (pid=${this.webAPIProcess.pid}).`);
            this.webAPIProcess.stdout.on('data', (data: any) => {
                log.info(WEBAPI_LOG_PREFIX, `${data}`);
            });
            this.webAPIProcess.stderr.on('data', (data: any) => {
                log.error(WEBAPI_LOG_PREFIX, `${data}`);
            });
            this.webAPIProcess.on('error', (err: Error) => {
                log.error(WEBAPI_LOG_PREFIX, err);
                if (!this.webAPIError) {
                    electron.dialog.showErrorBox(`${electron.app.getName()} - Internal Error`,
                                                 'Failed to start Cate service.');
                }
                this.webAPIError = err;
                electron.app.exit(ERRCODE_WEBAPI_INTERNAL_ERROR); // exit immediately
            });
            this.webAPIProcess.on('close', (code: number, signal: string) => {
                let message = `Cate service closed I/O with code ${code} due to ${signal}.`;
                if (!!code) {
                    log.error(WEBAPI_LOG_PREFIX, message);
                } else {
                    log.info(WEBAPI_LOG_PREFIX, message);
                }
            });
            this.webAPIProcess.on('exit', (code: number, signal: string) => {
                let message = `Cate service process exited with code ${code} due to ${signal}.`;
                if (!!code) {
                    log.error(WEBAPI_LOG_PREFIX, message);
                } else {
                    log.info(WEBAPI_LOG_PREFIX, message);
                }
            });

            callback();
        });
    }

    private stopWebAPIService() {
        // If there is no webAPIProcess instance, we haven't started the WebAPI service on our own.
        if (!this.webAPIProcess) {
            log.info(`Not stopping Cate service because we haven't started it.`);
            return;
        }
        const webAPIStopCommand = getWebAPIStopCommand(this.webAPIConfig);
        log.info(`Stopping Cate service: ${webAPIStopCommand}`);
        // this must be sync to make sure the stop is performed before this process ends
        const processData = child_process.spawnSync(webAPIStopCommand,[],
                                                    {
                                                        ...this.webAPIProcessOptions,
                                                        timeout: 1000 * this.webAPIStopTimeout
                                                    });
        if (processData.status !== 0 || processData.error) {
            log.error(`Failed to stop Cate service. Status: ${processData.status}, ${processData.error}`);
            log.warn(`Killing it (pid=${this.webAPIProcess.pid}), sending ${this.webAPIKillSignal}...`);
            this.webAPIProcess.kill(this.webAPIKillSignal);
            //this.webAPIProcess = null;
            //sleep(10000);
            //log.error("Still alive!");
        }
    }

    private resetWebAPIStartTime() {
        this.webAPIStartTime = process.hrtime();
    }

    private maybeInstallAutoUpdate() {
        if (process.env.NODE_ENV !== 'development') {
            const autoUpdateSoftware = this.preferences.data.autoUpdateSoftware || !isDefined(this.preferences.data.autoUpdateSoftware);
            if (autoUpdateSoftware) {
                installAutoUpdate(this.mainWindow);
            }
        }
    }

    private initMainWindow() {
        const mainWindowBounds = this.preferences.data.mainWindowBounds || {width: 1366, height: 768};
        this.mainWindow = new electron.BrowserWindow({
                                                         icon: getAppIconPath(),
                                                         title: `${electron.app.getName()} ${electron.app.getVersion()}`,
                                                         show: false,
                                                         ...mainWindowBounds
                                                     });

        // Emitted when the web page has been rendered (while not being shown)
        // and window can be displayed without a visual flash.
        this.mainWindow.once('ready-to-show', () => {
            log.info('Main window ready to show.');
            this.mainWindow.show();
        });

        // Emitted when the window is going to be closed.
        this.mainWindow.on('close', event => {
            log.info('Main window will be closed.');
            this.requestPreferencesUpdate();
            this.preferences.set('mainWindowBounds', this.mainWindow.getBounds());
            this.preferences.set('devToolsOpened', this.mainWindow.webContents.isDevToolsOpened());
            if (!this.quitConfirmed) {
                const suppressQuitConfirm = this.preferences.get('suppressQuitConfirm', false);
                if (suppressQuitConfirm) {
                    this.quitConfirmed = true;
                    this.forceQuit();
                } else {
                    // Prevent default behavior, which is closing the main window.
                    event.preventDefault();
                    // Bring up exit prompt.
                    this.confirmQuit((suppressQuitConfirm) => {
                        this.preferences.set('suppressQuitConfirm', suppressQuitConfirm);
                        this.storeUserPreferences();
                        this.quitConfirmed = true;
                        // Force window close, so app can quit after all windows closed.
                        // We must call destroy() here, calling close() seems to have no effect on Mac (Electron 1.8.2).
                        this.mainWindow.destroy();
                        this.forceQuit();
                    });
                }
            } else {
                this.forceQuit();
            }
        });

        // Emitted when the window is closed.
        this.mainWindow.on('closed', () => {
            log.info('Main window closed.');
            this.mainWindow = null;
        });
    }

    private forceQuit() {
        if (!this.quitRequested) {
            // Force quit on Mac
            log.warn("Forcing quit.");
            electron.app.quit();
        }
    }

    private confirmQuit(callback: (suppressQuitConfirm: boolean) => void) {
        const quitName = process.platform === 'darwin' ? 'Quit' : 'Exit';
        const options = {
            type: 'question',
            title: `${electron.app.getName()} - Confirm ${quitName}`,
            buttons: ['Cancel', quitName],
            //buttons: ['Cancel', "Yes"],
            cancelId: 0,
            message: `Are you sure you want to exit ${electron.app.getName()}?`,
            checkboxLabel: 'Do not ask me again',
            checkboxChecked: false,
        };
        electron.dialog.showMessageBox(this.mainWindow, options, (response: number, checkboxChecked: boolean) => {
            if (response === 1) {
                callback(checkboxChecked);
            }
        });
    }

    private showSplashWindow(callback: () => void) {
        this.splashWindow = new electron.BrowserWindow({
                                                           width: 256,
                                                           height: 280,
                                                           center: true,
                                                           show: true,
                                                           useContentSize: true,
                                                           frame: false,
                                                           alwaysOnTop: false,
                                                           transparent: true,
                                                           parent: this.mainWindow
                                                       });

        this.splashWindow.setIgnoreMouseEvents(true);
        this.splashWindow.on('closed', () => {
            this.splashWindow = null;
        });

        this.splashWindow.loadURL(url.format({
                                                 pathname: path.join(electron.app.getAppPath(), 'splash.html'),
                                                 protocol: 'file:',
                                                 slashes: true
                                             }));
        this.splashWindow.webContents.on('did-finish-load', callback);
    }

    private showSplashMessage(message: string) {
        log.info('Splash says:', message);
        if (this.isSplashWindowVisible()) {
            this.splashWindow.webContents.send('update-splash-message', message);
        } else {
            log.warn('showSplashMessage: splash not available', message);
        }
    }

    private loadMainWindow() {

        if (this.configuration.data.devToolsExtensions) {
            this.showSplashMessage('Installing developer tools...');
            for (let devToolsExtensionName of this.configuration.data.devToolsExtensions) {
                const devToolExtension = devTools[devToolsExtensionName];
                if (devToolExtension) {
                    installDevToolsExtension(devToolExtension)
                        .then(() => log.info(`Added DevTools extension "${devToolsExtensionName}"`))
                        .catch((err) => log.error('Failed to add DevTools extension: ', err));
                }
            }
        }

        this.showSplashMessage('Loading user interface...');

        const menu = electron.Menu.buildFromTemplate(menuTemplate);
        electron.Menu.setApplicationMenu(menu);

        this.mainWindow.loadURL(url.format({
                                               pathname: path.join(electron.app.getAppPath(), 'index.html'),
                                               protocol: 'file:',
                                               slashes: true
                                           }));

        this.mainWindow.webContents.on('did-finish-load', () => {
            this.showSplashMessage('Done.');
            if (this.isSplashWindowAlive()) {
                this.splashWindow.close();
            }
            const webAPIConfig = this.configuration.data.webAPIConfig;
            this.mainWindow.webContents.send('apply-initial-state', {
                session: this.preferences.data,
                appConfig: Object.assign({}, this.configuration.data, {
                    appPath: electron.app.getAppPath(),
                    webAPIConfig: Object.assign({}, webAPIConfig, {
                        restUrl: getWebAPIRestUrl(webAPIConfig),
                        apiWebSocketUrl: getAPIWebSocketsUrl(webAPIConfig),
                        mplWebSocketUrl: getMPLWebSocketsUrl(webAPIConfig),
                    }),
                })
            });

            this.maybeInstallAutoUpdate();
        });

        if (this.preferences.data.devToolsOpened) {
            // Open the DevTools.
            this.mainWindow.webContents.openDevTools();
        }
    }

    private ensureCateDir(callback: (setupPerformed: boolean) => void) {
        const setupInfo = getCateCliSetupInfo();
        log.info("setupInfo: ", setupInfo);

        if (setupInfo.oldCateDir) {
            setCateDir(setupInfo.oldCateDir);
        }

        // When there is no reason to setup anything, we're done.
        if (!setupInfo.setupReason) {
            callback(false);
            return;
        }

        // Close splash screen, because we now bring up the setup dialog
        if (this.isSplashWindowVisible()) {
            this.splashWindow.hide();
        }

        // Bring up the setup dialog
        doSetup(setupInfo, (setupResult: SetupResult) => {
            log.info("After setup: setupResult =", setupResult);
            if (setupResult) {
                const {cateDir, cateVersion} = setupResult;
                setCateDir(cateDir);
                if (this.isSplashWindowAlive()) {
                    this.splashWindow.show();
                }
                const versionDir = path.join(getAppDataDir(), cateVersion);
                const locationFile = path.join(versionDir, "cate.location");
                const errorHandler = (err) => {
                    log.error("Writing failed: ", err);
                    electron.dialog.showErrorBox(`${electron.app.getName()} - Error`,
                                                 `Writing to ${locationFile} failed:\n${err}`);
                    electron.app.exit(ERRCODE_SETUP_FAILED);
                };
                log.warn("Writing ", locationFile);
                if (!fs.existsSync(versionDir)) {
                    try {
                        fs.mkdirSync(versionDir);
                    } catch (err) {
                        errorHandler(err);
                    }
                }
                fs.writeFile(locationFile, cateDir, {encoding: 'utf8'}, err => {
                    if (!err) {
                        callback(true);
                    } else {
                        errorHandler(err);
                    }
                });
            } else {
                // User cancelled update: exit immediately
                electron.app.exit(0);
            }
        });
    }

    private isSplashWindowVisible() {
        return this.isSplashWindowAlive() && this.splashWindow.isVisible();
    }

    private isSplashWindowAlive() {
        return this.splashWindow && !this.splashWindow.isDestroyed();
    }

    private getOptionArg(options: string[]): string | null {
        let args: Array<string> = process.argv.slice(1);
        for (let i = 0; i < args.length; i++) {
            if (options.indexOf(args[i]) >= 0 && i < args.length - 1) {
                return args[i + 1];
            }
        }
        return null;
    }

    private initUserConfiguration(): void {
        this.configuration = this.loadConfiguration(CONFIG_OPTIONS,
                                                    path.resolve('cate-config.js'),
                                                    'User configuration');
    }

    private initUserPreferences(): void {
        this.preferences = this.loadConfiguration(PREFS_OPTIONS,
                                                  this.getDefaultUserPreferencesFile(),
                                                  'User preferences');
        log.warn("debugWorldView =", this.preferences.data.debugWorldView);
        this.preferences.data.debugWorldView = false;
    }

    private storeUserPreferences() {
        this.storeConfiguration(this.preferences, PREFS_OPTIONS,
                                this.getDefaultUserPreferencesFile(),
                                'User preferences')
    }

    private getDefaultUserPreferencesFile() {
        if (this.configuration.data.prefsFile) {
            return this.configuration.data.prefsFile;
        }
        return path.join(getAppDataDir(), 'preferences.json');
    }

    private loadConfiguration(options: string[], defaultConfigFile: string, configType: string): Configuration {
        let config = new Configuration();
        let configFile = this.getOptionArg(options);
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

    private storeConfiguration(config: Configuration, options: string[], defaultConfigFile: string, configType: string) {
        let configFile = this.getOptionArg(options);
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

    private maybeRunModule(): boolean {
        let modulePath = this.getOptionArg(RUN_OPTIONS);
        if (modulePath) {
            try {
                const module = require(modulePath);
                const exitCode = module.run();
                if (exitCode === 0) {
                    return true;
                } else if (isNumber(exitCode)) {
                    process.exit(exitCode);
                }
            } catch (e) {
                log.error(e);
                process.exit(1);
            }
        }

        return false;
    }

    static ensureAppDataDir(): boolean {
        const appDataDir = getAppDataDir();
        if (!fs.existsSync(appDataDir)) {
            try {
                fs.mkdirSync(appDataDir);
            } catch (err) {
                log.error(err);
                return false;
            }
        }
        return true;
    }
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

/*
function sleep(time: number) {
    const stop = new Date().getTime();
    while(new Date().getTime() < stop + time) {
        ;
    }
}
*/
