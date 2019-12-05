import * as electron from 'electron';
import installDevToolsExtension from 'electron-devtools-installer';
import * as devTools from 'electron-devtools-installer';
import * as log from 'electron-log';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import * as child_process from 'child_process'
import { request } from './request';
import { updateConditionally } from '../common/objutil';
import { Configuration } from './configuration';
import { menuTemplate } from './menu';
import {
    getAppDataDir,
    getAppIconPath,
    getCateWebAPISetupInfo,
    setCateDir,
    getWebAPIStartCommand,
    getWebAPIRestUrl,
    getMPLWebSocketsUrl,
    getAPIWebSocketsUrl,
    defaultSpawnShellOption,
    isWebAPIVersionCompatible,
    EXPECTED_CATE_WEBAPI_VERSION,
    getProxySettings,
    getSessionProxyConfig,
    isLocalWebAPIService
} from './appenv';
import * as net from 'net';
import { installAutoUpdate } from './update-frontend';
import { isDefined, isNumber, isString } from '../common/types';
import { WebAPIConfig } from '../renderer/state';

const PREFS_OPTIONS = ['--prefs', '-p'];
const CONFIG_OPTIONS = ['--config', '-c'];
const RUN_OPTIONS = ['--run', '-r'];

const WEBAPI_LOG_PREFIX = 'cate-webapi:';

const ERRCODE_WEBAPI_INTERNAL_ERROR = 1;
const ERRCODE_WEBAPI_TIMEOUT = 2;
const ERRCODE_WEBAPI_NO_FREE_PORT = 3;
const ERRCODE_WEBAPI_VERSION = 4;
const ERRCODE_SETUP_FAILED = 5;

// Timeout for starting WebAPI in seconds.
// See https://github.com/CCI-Tools/cate/issues/550
const WEBAPI_START_TIMEOUT_MAX = 60;

// WebAPI access timeout in seconds:
const WEBAPI_ACCESS_TIMEOUT_MAX = 0.5;

// Delay between two WebAPI accesses in seconds:
const WEBAPI_ACCESS_DELAY_MAX = 0.5;

// Signal used to kill a running WebAPI service if a stop requiest times out:
const WEBAPI_KILL_SIGNAL = 'SIGTERM';

const NANOS_PER_SEC = 1.0e9;

const USE_PROXY_CONFIG_IF_SET = true;

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

    private quitRequested = false;
    private quitConfirmed = false;
    private exitRequested = false;

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
        return this.preferences.get('webAPIStartTimeout', WEBAPI_START_TIMEOUT_MAX);
    }

    get webAPIAccessTimeout(): number {
        return this.preferences.get('webAPIAccessTimeout', WEBAPI_ACCESS_TIMEOUT_MAX);
    }

    get webAPIAccessDelay(): number {
        return this.preferences.get('webAPIAccessDelay', WEBAPI_ACCESS_DELAY_MAX);
    }

    get webAPIStartTimeDelta(): number {
        const delta = process.hrtime(this.webAPIStartTime);
        return delta[0] + delta[1] / NANOS_PER_SEC;
    }

    get webAPIKillSignal(): string {
        return this.preferences.get('webAPIKillSignal', WEBAPI_KILL_SIGNAL);
    }

    start() {
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
            log.warn('Should quit, because it is a second app instance.');
            electron.app.quit();
            return;
        }

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

        log.info(getLineString('='));
        log.info(getAppInfoString());
        log.info(getLineString('='));

        log.info('process.versions =', process.versions);

        const proxySettings = getProxySettings(process.env);
        if (USE_PROXY_CONFIG_IF_SET && proxySettings) {
            log.info('proxySettings:', proxySettings);
            // See https://github.com/electron/electron/blob/master/docs/api/chrome-command-line-switches.md#--proxy-bypass-listhosts
            electron.app.commandLine.appendSwitch('proxy-server', proxySettings.proxyServer);
            if (proxySettings.proxyBypassList) {
                electron.app.commandLine.appendSwitch('proxy-bypass-list', proxySettings.proxyBypassList);
            }
        }

        if (process.platform === 'darwin') {
            // Try getting around https://github.com/CCI-Tools/cate-desktop/issues/32
            // See https://electron.atom.io/docs/api/app/#appcommandlineappendswitchswitch-value
            // See https://bugs.chromium.org/p/chromium/issues/detail?id=682075&desc=2
            electron.app.commandLine.appendSwitch('disable_chromium_framebuffer_multisample');
            electron.app.commandLine.appendSwitch('disable_depth_texture');
        }

        if (process.platform === 'win32') {
            // Try getting around https://github.com/CCI-Tools/cate/issues/615
            // See electron-builder issue "checkForUpdatesAndNotify updates but does not notify on Windows 10"
            // https://github.com/electron-userland/electron-builder/issues/2700
            electron.app.setAppUserModelId('org.esa.ccitools.Cate');
            electron.app.setAsDefaultProtocolClient('cate-desktop');
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
            this.loadMainWindow();
        });

        electron.app.on('window-all-closed', () => {
            log.info('All windows closed.');
            // Quit - also on Mac OS.
            electron.app.quit();
        });

        // Emitted before the application starts closing its windows.
        electron.app.on('before-quit', () => {
            log.info('Quit requested.');
            this.quitRequested = true;
        });

        // Emitted when all windows have been closed and the application will quit.
        electron.app.on('quit', () => {
            log.info('Quit!');
            this.maybeStopLocalWebAPIService();
            // Unconditionally exit the application.
            // This is not nice but should be solid fix for annoying issue
            // https://github.com/CCI-Tools/cate/issues/765
            // "GUI doesn't reopen after closing it"
            log.info('Exiting now...');
            this.exitRequested = true;
            electron.app.exit(0);
        });

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
            let report: string;
            let detail: string = messageBoxOptions.detail;
            let reportTag = '___REPORT___:\n';
            if (detail && detail.startsWith(reportTag)) {
                report = detail.substr(reportTag.length);
                messageBoxOptions = {...messageBoxOptions, detail: undefined};
            }
            if (report) {
                messageBoxOptions = {
                    ...messageBoxOptions,
                    checkboxLabel: messageBoxOptions.checkboxLabel || 'Copy report to clipboard',
                    checkboxChecked: false,
                };
                reportingEnabled = true;
            }
            electron.dialog.showMessageBox(this.mainWindow, messageBoxOptions, (buttonIndex: number, checkboxChecked: boolean) => {
                if (reportingEnabled && checkboxChecked) {
                    const reportEntries = [
                        electron.app.getName() + ', version ' + electron.app.getVersion(),
                        report,
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

        electron.ipcMain.on('start-local-service', (event) => {
            log.info(`Starting local Cate service...`);
            this.maybeStartLocalWebAPIService();
        });

        electron.ipcMain.on('stop-local-service', (event) => {
            log.info(`Stopping local Cate service...`);
            this.maybeStopLocalWebAPIService();
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
            serviceProtocol: 'http',
            serviceFile: path.join(getAppDataDir(), 'webapi-info.json'),
            // Refer to https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
            processOptions: {},
        });
        this.configuration.set('webAPIConfig', webAPIConfig);
        // TODO (SabineEmbacher) find a better solution for context injection
        electron.app['_configuration'] = this.configuration;
    }

    private maybeStartLocalWebAPIService() {
        if (this.webAPIStartTime === null) {
            // Set start time, unless it has already been done
            this.resetWebAPIStartTime();
            this.updateInitMessage('Waiting for Cate service...');
        }

        let serviceFound = false;

        const internalErrorTitle = `${electron.app.getName()} - Internal Error`;

        log.info(`Waiting for response from local Cate service ${this.webAPIRestUrl}`);
        request(this.webAPIRestUrl, this.webAPIAccessTimeout)
            .then((response: string) => {
                serviceFound = true;
                log.info('Connected to Cate service. Response: ', response);
                // Get the actual WebAPI service version:
                const message = JSON.parse(response);
                const version = message.status === 'ok' && message.content && message.content.version;
                if (version) {
                    if (!isWebAPIVersionCompatible(version, true)) {
                        // Incompatible WebAPI service version
                        const msg = `Cate service version ${EXPECTED_CATE_WEBAPI_VERSION} expected, but found ${version}`;
                        electron.dialog.showErrorBox(internalErrorTitle, msg);
                        electron.app.exit(ERRCODE_WEBAPI_VERSION);
                        return;
                    }
                } else {
                    // Can't get version info
                    const msg = `Cate service version ${EXPECTED_CATE_WEBAPI_VERSION} expected, but found none at all.`;
                    electron.dialog.showErrorBox(internalErrorTitle, msg);
                    electron.app.exit(ERRCODE_WEBAPI_VERSION);
                    return;
                }

                const webAPIConfig = this.configuration.data.webAPIConfig as WebAPIConfig;
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
            })
            .catch((err) => {
                const delta = this.webAPIStartTimeDelta;
                const deltaStr = delta.toFixed(2);
                if (serviceFound) {
                    log.info(`Problem with existing Cate service persists after ${deltaStr} seconds: ${err}`);
                } else {
                    log.info(`No response from Cate service after ${deltaStr} seconds: ${err}`);
                }
                this.updateInitMessage(`Waiting for Cate service (${deltaStr}s)`);
                let callback = () => {
                    if (delta > this.webAPIStartTimeout) {
                        log.error(`Failed to start Cate service within ${deltaStr} seconds: ${err}`);
                        if (!this.webAPIError) {
                            const msg = `Failed to start Cate service within ${deltaStr} seconds:\n${err}`;
                            electron.dialog.showErrorBox(internalErrorTitle, msg);
                        }
                        electron.app.exit(ERRCODE_WEBAPI_TIMEOUT);
                    } else {
                        setTimeout(this.maybeStartLocalWebAPIService.bind(this), 1000 * this.webAPIAccessDelay);
                    }
                };
                if (!this.webAPIProcess) {
                    this.ensureLocalCateDir((setupPerformed: boolean) => {
                        if (setupPerformed) {
                            // We may have spend considerable time in the setup dialog, so reset the start time.
                            this.resetWebAPIStartTime();
                        }
                        this.startLocalWebAPIService(callback)
                    });
                } else {
                    callback();
                }
            });
    }

    private startLocalWebAPIService(callback: () => void) {

        this.updateInitMessage('Searching unused port...');
        findFreePort(this.webAPIConfig.servicePort, null, (freePort: number) => {
            if (freePort < this.webAPIConfig.servicePort) {
                log.error('Can\'t find any free port');
                electron.dialog.showErrorBox(`${electron.app.getName()} - Error`, 'Can\'t find any free port');
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
            this.webAPIProcess.on('exit', (code: number, signal: string) => {
                let message = 'Cate service exited';
                if (isNumber(code)) {
                    message += ` with code ${code}`;
                }
                if (isString(signal)) {
                    message += ` due to ${signal}`;
                }
                log.info(WEBAPI_LOG_PREFIX, message);
            });

            callback();
        });
    }

    private maybeStopLocalWebAPIService() {
        // If there is no webAPIProcess instance, we haven't started the WebAPI service on our own.
        if (!this.webAPIProcess) {
            log.info(`Not stopping Cate service because we haven't started it.`);
            return;
        }

        let pid;
        try {
            const serviceConfig = JSON.parse(fs.readFileSync(this.webAPIConfig.serviceFile, 'utf8'));
            pid = serviceConfig.pid;
        } catch (e) {
            log.error(e);
        }

        const signal = this.webAPIKillSignal;

        if (isNumber(pid)) {
            log.info(`Sending ${signal} to Cate service process...`);
            process.kill(pid, signal);
        } else {
            log.error(`Invalid PID: ${pid}`);
        }

        if (this.webAPIProcess.connected) {
            log.info(`Sending ${signal} to Cate service parent process...`);
            this.webAPIProcess.kill(signal);
        } else {
            log.info('Cate service parent process is no longer connected.');
        }
    }

    private resetWebAPIStartTime() {
        this.webAPIStartTime = process.hrtime();
    }

    private maybeInstallAutoUpdate() {
        if (process.env.NODE_ENV !== 'development') {
            const autoUpdateSoftware = this.preferences.data.autoUpdateSoftware
                || !isDefined(this.preferences.data.autoUpdateSoftware);
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
            log.info(`Main window will be closed. `
                         + `Possible reason: ${this.quitRequested ? 'quit requested' : 'window closed'}`);
            this.requestPreferencesUpdate();
            this.preferences.set('mainWindowBounds', this.mainWindow.getBounds());
            this.preferences.set('devToolsOpened', this.mainWindow.webContents.isDevToolsOpened());
            if (!this.quitConfirmed) {
                const suppressQuitConfirm = this.preferences.get('suppressQuitConfirm', false);
                if (suppressQuitConfirm) {
                    this.quitConfirmed = true;
                    log.info('Quit confirmed by user preference.');
                    this.forceQuit();
                } else {
                    log.info('Quit to be confirmed by user...');
                    // Prevent default behavior, which is closing the main window.
                    event.preventDefault();
                    // Bring up exit prompt.
                    this.confirmQuit((suppressQuitConfirm) => {
                        this.quitConfirmed = true;
                        log.info(`Quit confirmed by user (suppressQuitConfirm=${suppressQuitConfirm}).`);
                        try {
                            this.preferences.set('suppressQuitConfirm', suppressQuitConfirm);
                            this.storeUserPreferences();
                            // Force window to be destroyed.
                            // Neither this.mainWindow.close() nor the following this.forceQuit() alone
                            // has the desired effect on Mac OS.
                            this.mainWindow.destroy();
                        } catch (e) {
                            log.error(e);
                        } finally {
                            this.forceQuit();
                        }
                    });
                }
            } else {
                log.info('Quit confirmed.');
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
        if (this.quitRequested) {
            log.info('Forcing quit due to explicit request.');
        } else {
            // if this.quitRequested is false, the event "before-quit" has not been sent, which means
            // electron.app.quit() has not been called.
            // This happens on Mac, when users click the main window's close icon.
            log.warn('Forcing quit without explicit request.');
        }
        electron.app.quit();
    }

    private confirmQuit(callback: (suppressQuitConfirm: boolean) => void) {
        const quitName = process.platform === 'darwin' ? 'Quit' : 'Exit';
        const options = {
            type: 'question',
            title: `${electron.app.getName()} - Confirm ${quitName}`,
            buttons: ['Cancel', quitName],
            //buttons: ['Cancel', "Yes"],
            cancelId: 0,
            message: `Are you sure you want to exit ${electron.app.getName()}?\nUnsaved workspace changes will be lost.`,
            checkboxLabel: 'Do not ask me again',
            checkboxChecked: false,
        };
        electron.dialog.showMessageBox(this.mainWindow, options, (response: number, checkboxChecked: boolean) => {
            if (response === 1) {
                callback(checkboxChecked);
            }
        });
    }

    private updateInitMessage(message: string) {
        log.info('Status update:', message);
        this.mainWindow.webContents.send('update-init-message', message);
    }

    private loadMainWindow() {
        this.mainWindow.loadURL(url.format({
                                               pathname: path.join(electron.app.getAppPath(), 'index.html'),
                                               protocol: 'file:',
                                               slashes: true
                                           }));

        if (this.configuration.data.devToolsExtensions) {
            this.updateInitMessage('Installing developer tools...');
            for (let devToolsExtensionName of this.configuration.data.devToolsExtensions) {
                const devToolExtension = devTools[devToolsExtensionName];
                if (devToolExtension) {
                    installDevToolsExtension(devToolExtension)
                        .then(() => log.info(`Added DevTools extension "${devToolsExtensionName}"`))
                        .catch((err) => log.error('Failed to add DevTools extension: ', err));
                }
            }
        }

        const menu = electron.Menu.buildFromTemplate(menuTemplate);
        electron.Menu.setApplicationMenu(menu);

        let sessionProxyConfig = getSessionProxyConfig(process.env);
        if (USE_PROXY_CONFIG_IF_SET && sessionProxyConfig) {
            this.mainWindow.webContents.session.setProxy(sessionProxyConfig, () => {
                // See https://electronjs.org/docs/api/session
                log.info('session proxy configuration set: ', sessionProxyConfig);
            });
        }

        // Solution found at
        // https://stackoverflow.com/questions/32402327/how-can-i-force-external-links-from-browser-window-to-open-in-a-default-browser
        this.mainWindow.webContents.on('will-navigate', (e, url) => {
            /* If url isn't the actual page */
            if (url != this.mainWindow.webContents.getURL()) {
                e.preventDefault();
                electron.shell.openExternal(url);
            }
        });

        this.mainWindow.webContents.on('did-finish-load', () => {
            this.updateInitMessage('Done.');
            this.maybeInstallAutoUpdate();
        });

        if (this.preferences.data.devToolsOpened) {
            // Open the DevTools.
            this.mainWindow.webContents.openDevTools();
        }
    }

    private ensureLocalCateDir(callback: (setupPerformed: boolean) => void) {
        const setupInfo = getCateWebAPISetupInfo();
        log.info('Computed setup information: ', setupInfo);

        if (setupInfo.oldCateDir) {
            setCateDir(setupInfo.oldCateDir);
        }

        // When there is no reason to setup anything, we're done.
        if (!setupInfo.setupReason) {
            callback(false);
            return;
        }

        if (setupInfo.setupReason === 'INSTALL_CATE') {
            electron.dialog.showErrorBox(
                `${electron.app.getName()} - Error`,
                `Unable locating "cate" Python package,\n`
                    + `requiring version ${setupInfo.newCateVersion}.`
            );
        } else if (setupInfo.setupReason === 'UPDATE_CATE') {
            electron.dialog.showErrorBox(
                `${electron.app.getName()} - Error`,
                'Found out-of-date "cate" Python package,\n'
                    + `requiring version ${setupInfo.newCateVersion}.`
                    + `found version ${setupInfo.oldCateVersion},\n`
                    + `in ${setupInfo.oldCateDir},\n`
            );
        }
        electron.app.exit(ERRCODE_SETUP_FAILED);
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
        log.warn('debugWorldView =', this.preferences.data.debugWorldView);
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

function getLineString(s: string) {
    return new Array(80).join(s);
}

function getAppInfoString() {
    return electron.app.getName() + ', version ' + electron.app.getVersion();
}
