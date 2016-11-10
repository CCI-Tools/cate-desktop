const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let _mainWindow;
let _baseDir;

function getAppIconPath() {
    var icon_file = "cate-icon.png";
    if (process.platform === "darwin") {
        icon_file = "darwin/cate-icon.icns";
    } else if (process.platform === "win32") {
        icon_file = "win32/cate-icon.ico";
    }
    return path.join(_baseDir, 'resources', icon_file);
}

function createMainWindow() {
    // Create the browser window.
    _mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: getAppIconPath(),
    });

    // and load the index.html of the app.
    _mainWindow.loadURL(url.format({
        pathname: path.join(_baseDir, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    // Open the DevTools.
    _mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    _mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        _mainWindow = null
    });
}

export function init(baseDir: string) {
    _baseDir = baseDir;

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.on('ready', createMainWindow);

    // Quit when all windows are closed.
    app.on('window-all-closed', function () {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', function () {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (_mainWindow === null) {
            createMainWindow();
        }
    });

    // In this file you can include the rest of your app's specific main process
    // code. You can also put them in separate files and require them here.
}

