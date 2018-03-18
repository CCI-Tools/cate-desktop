import * as electron from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as semver from "semver";
import {pep440ToSemver} from "../common/version";
import {SETUP_REASON_INSTALL_CATE, SETUP_REASON_UPDATE_CATE, SetupInfo} from "../common/setup";
import * as assert from "../common/assert";


/**
 * Identifies the required version of the Cate WebAPI.
 * The value is a SemVer (https://github.com/npm/semver) compatible version range string.
 * @type {string}
 */
export const APP_CLI_VERSION_RANGE = ">=2.0.0-dev.5 <2.1.0";

/**
 * Version of cate-cli that is know to run with this version of Cate Desktop.
 * Note the version name must be compatible with PEP-440 and a cate-cli package
 * with that version should have been deployed.
 * @type {string}
 */
export const EXPECTED_APP_CLI_VERSION = "2.0.0.dev5";

export const CATE_CLI_NAME = "cate";
export const CATE_WEBAPI_NAME = "cate-webapi";

export const CATE_CLI_EXECUTABLE = (() => {
    if (process.platform === 'win32') {
        return path.join("Scripts", `${CATE_CLI_NAME}.exe`);
    } else {
        return path.join("bin", CATE_CLI_NAME);
    }
})();

export const CATE_WEBAPI_EXECUTABLE = (() => {
    if (process.platform === 'win32') {
        return path.join("Scripts", `${CATE_WEBAPI_NAME}.exe`);
    } else {
        return path.join("bin", CATE_WEBAPI_NAME);
    }
})();

export const CONDA_EXECUTABLES = (() => {
    if (process.platform === 'win32') {
        return ["python.exe", path.join("Scripts", "activate.bat"), path.join("Scripts", "deactivate.bat")];
    } else {
        return [path.join("bin", "python"), path.join("bin", "activate"), path.join("bin", "deactivate")];
    }
})();

export const CATE_EXECUTABLES = (() => {
    return [CATE_CLI_EXECUTABLE, CATE_WEBAPI_EXECUTABLE].concat(CONDA_EXECUTABLES);
})();


const app = electron.app;

let _cateDir = null;

export function getAppIconPath() {
    let iconFile = "cate-icon.png";
    if (process.platform === "darwin") {
        iconFile = "darwin/cate-icon.hqx";
    } else if (process.platform === "win32") {
        iconFile = "win32/cate-icon.ico";
    }
    return path.join(app.getAppPath(), 'resources', iconFile);
}

export function getAppDataDir() {
    return path.join(app.getPath('home'), '.cate');
}

export function getWebAPIStartCommand(webAPIConfig): string {
    const command = getWebAPICommandBase(webAPIConfig);
    return getCommandInActivatedCate(getCateDirSafe(), command + ' start');
}

export function getWebAPIStopCommand(webAPIConfig): string {
    const command = getWebAPICommandBase(webAPIConfig);
    return getCommandInActivatedCate(getCateDirSafe(), command + ' stop');
}

function getWebAPICommandBase(webAPIConfig): string {
    let args = `cate-webapi --caller cate-desktop --port ${webAPIConfig.servicePort} --file "${webAPIConfig.serviceFile}"`;
    if (webAPIConfig.serviceAddress) {
        args += ` --address "${webAPIConfig.serviceAddress}"`;
    }
    return args;
}

export function getWebAPIRestUrl(webAPIConfig) {
    return `http://${webAPIConfig.serviceAddress || '127.0.0.1'}:${webAPIConfig.servicePort}/`;
}

export function getAPIWebSocketsUrl(webAPIConfig) {
    return `ws://${webAPIConfig.serviceAddress || '127.0.0.1'}:${webAPIConfig.servicePort}/api`;
}

export function getMPLWebSocketsUrl(webAPIConfig) {
    return `ws://${webAPIConfig.serviceAddress || '127.0.0.1'}:${webAPIConfig.servicePort}/mpl/figures/`;
}

export function getCateDirSafe() {
    assert.ok(_cateDir && _cateDir !== "", "internal error: _cateDir=" + _cateDir);
    return _cateDir;
}

export function getCateDir() {
    return _cateDir;
}

export function setCateDir(cateDir: string) {
    assert.ok(cateDir && cateDir !== "", "internal error: cateDir=" + cateDir);
    _cateDir = cateDir;
}

export function getCateCliSetupInfo(): SetupInfo {
    const newCateVersion = EXPECTED_APP_CLI_VERSION; // PEP440
    const newCateDir = path.join(app.getPath("home"), "cate-" + newCateVersion);
    const dataDir = getAppDataDir();
    if (fs.existsSync(dataDir)) {
        const expectedVersion = pep440ToSemver(newCateVersion); // SemVer
        const fileNames = fs.readdirSync(dataDir);
        const updateInfos: { [version: string]: SetupInfo } = {};
        for (let fileName of fileNames) {
            const version = pep440ToSemver(fileName); // SemVer
            if (semver.valid(version, true)) {
                const oldCateVersion = fileName;
                const locationFile = path.join(dataDir, fileName, 'cate.location');
                let oldCateDir;
                try {
                    oldCateDir = fs.readFileSync(locationFile, 'utf8').trim();
                } catch (err) {
                    continue;
                }

                const cateWebapiExe = path.join(oldCateDir, CATE_WEBAPI_EXECUTABLE);
                if (isExec(cateWebapiExe)) {
                    const updateInfo = {oldCateDir, newCateDir, oldCateVersion, newCateVersion, setupReason: null};
                    // Return immediately if the versions are equal.
                    if (semver.eq(version, app.getVersion(), true)) {
                        return updateInfo;
                    }
                    updateInfos[version] = updateInfo;
                }
            }
        }

        // We use descending version names, so we always pick the highest compatible version
        let descendingVersions = Object.getOwnPropertyNames(updateInfos);
        descendingVersions.sort((v1: string, v2: string) => semver.compare(v2, v1, true));

        for (let version of descendingVersions) { // SemVer
            if (semver.satisfies(version, APP_CLI_VERSION_RANGE, true)) {
                return {
                    ...updateInfos[version],
                    setupReason: semver.lt(version, expectedVersion, true) ? SETUP_REASON_UPDATE_CATE : null,
                };
            }
        }

        for (let version of descendingVersions) { // SemVer
            if (semver.lt(version, expectedVersion, true)) {
                return {
                    ...updateInfos[version],
                    setupReason: SETUP_REASON_UPDATE_CATE,
                };
            }
        }
    }

    return {
        newCateDir,
        newCateVersion,
        setupReason: SETUP_REASON_INSTALL_CATE,
    };
}

function isExec(path: string): boolean {
    try {
        fs.accessSync(path, fs.constants.X_OK);
        return true;
    } catch (err) {
        return false;
    }
}


export function getCommandInActivatedCate(cateDir: string, command: string) {
    return getCommandInActivatedCondaEnv(cateDir, cateDir, command);
}

export function getCommandInActivatedCondaEnv(condaDir: string, envDir: string, command: string) {
    if (process.platform === 'win32') {
        const activatePath = path.join(condaDir, "Scripts", "activate");
        return `"${activatePath}" "${envDir}" & ${command}`;
    } else {
        const activatePath = path.join(condaDir, "bin", "activate");
        return `source "${activatePath}" "${envDir}"; ${command}`;
    }
}


// on Unix '/bin/sh' is the dafault
// BUT on Ubuntu this links to 'dash' which doesn't work together with 'conda'
export function defaultSpawnShellOption() {
    if (process.platform === "win32") {
        return {shell: true};
    } else {
        return {shell: '/bin/bash'};
    }
}

export function defaultExecShellOption() {
    if (process.platform !== "win32") {
        return {shell: '/bin/bash'};
    }
}
