import * as electron from 'electron';
import * as log from 'electron-log';
import * as path from 'path';
import * as fs from 'fs';
import * as semver from 'semver';
import { pep440ToSemver } from '../common/version';
import { SETUP_REASON_INSTALL_CATE, SETUP_REASON_UPDATE_CATE, SetupInfo } from '../common/setup';
import * as assert from '../common/assert';


/**
 * Identifies the required version of the Cate WebAPI.
 * The value is a SemVer (https://github.com/npm/semver) compatible version range string.
 * @type {string}
 */
export const CATE_WEBAPI_VERSION_RANGE = '>=2.0.0-dev.24 <2.1.0';

/**
 * Version of the Cate WebAPI that is know to run with this version of Cate Desktop.
 * Note that
 * - the version name must be compatible with PEP-440 and
 * - a "cate-cli" package with that version should have been deployed to Anaconda channel "ccitools".
 *
 * @type {string}
 */
export const EXPECTED_CATE_WEBAPI_VERSION = '2.0.0.dev24';

export const CATE_CLI_NAME = 'cate';
export const CATE_WEBAPI_NAME = 'cate-webapi-start';

export const CATE_CLI_EXECUTABLE = (() => {
    if (process.platform === 'win32') {
        return path.join('Scripts', `${CATE_CLI_NAME}.exe`);
    } else {
        return path.join('bin', CATE_CLI_NAME);
    }
})();

export const CATE_WEBAPI_EXECUTABLE = (() => {
    if (process.platform === 'win32') {
        return path.join('Scripts', `${CATE_WEBAPI_NAME}.exe`);
    } else {
        return path.join('bin', CATE_WEBAPI_NAME);
    }
})();

export const CONDA_EXECUTABLES = (() => {
    if (process.platform === 'win32') {
        return ['python.exe', path.join('Scripts', 'activate.bat'), path.join('Scripts', 'deactivate.bat')];
    } else {
        // On Darwin/Linux the bin/activate and bin/deactivate scripts may have no execute permission
        return [path.join('bin', 'python') /*, path.join('bin', 'activate'), path.join('bin', 'deactivate')*/];
    }
})();

export const CATE_EXECUTABLES = (() => {
    return [CATE_CLI_EXECUTABLE, CATE_WEBAPI_EXECUTABLE].concat(CONDA_EXECUTABLES);
})();

const DEFAULT_SERVICE_ADDRESS = 'localhost';


let _cateDir = null;

export function getAppIconPath() {
    let iconFile = 'cate-icon.png';
    if (process.platform === 'darwin') {
        iconFile = 'darwin/cate-icon.hqx';
    } else if (process.platform === 'win32') {
        iconFile = 'win32/cate-icon.ico';
    }
    return path.join(electron.app.getAppPath(), 'resources', iconFile);
}

export function getAppDataDir() {
    return path.join(electron.app.getPath('home'), '.cate');
}

export function isWebAPIVersionCompatible(version: string, pep440?: boolean) {
    if (pep440) {
        version = pep440ToSemver(version);
    }
    return semver.satisfies(version, CATE_WEBAPI_VERSION_RANGE, true);
}

export function getWebAPIStartCommand(webAPIConfig): string {
    let command = `cate-webapi-start --caller cate-desktop --port ${webAPIConfig.servicePort} --file "${webAPIConfig.serviceFile}" --verbose`;
    if (webAPIConfig.serviceAddress) {
        command += ` --address "${webAPIConfig.serviceAddress}"`;
    }
    return getCommandInActivatedCate(getCateDirSafe(), command);
}

export function getWebAPIRestUrl(webAPIConfig) {
    return `http://${webAPIConfig.serviceAddress || DEFAULT_SERVICE_ADDRESS}:${webAPIConfig.servicePort}/`;
}

export function getAPIWebSocketsUrl(webAPIConfig) {
    return `ws://${webAPIConfig.serviceAddress || DEFAULT_SERVICE_ADDRESS}:${webAPIConfig.servicePort}/api`;
}

export function getMPLWebSocketsUrl(webAPIConfig) {
    return `ws://${webAPIConfig.serviceAddress || DEFAULT_SERVICE_ADDRESS}:${webAPIConfig.servicePort}/mpl/figures/`;
}

export function getCateDirSafe() {
    assert.ok(_cateDir && _cateDir !== '', `internal error: cateDir=${_cateDir}`);
    return _cateDir;
}

export function getCateDir() {
    return _cateDir;
}

export function setCateDir(cateDir: string) {
    assert.ok(cateDir && cateDir !== '', `internal error: cateDir=${cateDir}`);
    _cateDir = cateDir;
    log.info(`Cate directory set to ${_cateDir}`)
}

export function getCateWebAPISetupInfo(): SetupInfo {
    const newCateVersion = EXPECTED_CATE_WEBAPI_VERSION; // PEP440
    const newCateDir = path.join(electron.app.getPath('home'), 'cate-' + newCateVersion);
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
                log.info(`Checking Cate installation directory: ${locationFile}`);
                let oldCateDir;
                try {
                    oldCateDir = fs.readFileSync(locationFile, 'utf8').trim();
                } catch (err) {
                    log.error(err);
                    continue;
                }

                const cateWebapiExe = path.join(oldCateDir, CATE_WEBAPI_EXECUTABLE);
                if (isExec(cateWebapiExe)) {
                    log.info(`Cate WebAPI executable found: ${cateWebapiExe}`);
                    const updateInfo = {oldCateDir, newCateDir, oldCateVersion, newCateVersion, setupReason: null};
                    // Return immediately if the versions are equal.
                    if (semver.eq(version, electron.app.getVersion(), true)) {
                        return updateInfo;
                    }
                    updateInfos[version] = updateInfo;
                } else {
                    log.error(`Cate WebAPI executable not found: ${cateWebapiExe}`);
                }
            }
        }

        // We use descending version names, so we always pick the highest compatible version
        let descendingVersions = Object.getOwnPropertyNames(updateInfos);
        descendingVersions.sort((v1: string, v2: string) => semver.compare(v2, v1, true));

        for (let version of descendingVersions) { // SemVer
            if (isWebAPIVersionCompatible(version)) {
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
        const activatePath = path.join(condaDir, 'Scripts', 'activate');
        return `"${activatePath}" "${envDir}" & ${command}`;
    } else {
        const activatePath = path.join(condaDir, 'bin', 'activate');
        return `source "${activatePath}" "${envDir}"; exec ${command}`;
    }
}


export function defaultSpawnShellOption() {
    if (process.platform === 'win32') {
        return {shell: true};
    } else {
        // On Unix '/bin/sh' is the default, on Ubuntu this links to
        // dash which doesn't work together with conda.
        return {shell: '/bin/bash'};
    }
}

export function defaultExecShellOption() {
    if (process.platform === 'win32') {
        return null;
    } else {
        // On Unix '/bin/sh' is the default, on Ubuntu this links to
        // dash which doesn't work together with conda.
        return {shell: '/bin/bash'};
    }
}

// Names of environment variables that provide a proxy setting
const PROXY_ENV_VAR_NAMES = ['http_proxy', 'HTTP_PROXY', 'https_proxy', 'HTTPS_PROXY', 'socks_proxy', 'SOCKS_PROXY'];
const NO_PROXY_ENV_VAR_NAMES = ['no_proxy', 'NO_PROXY'];


export function getProxySettings(env?: { [name: string]: string }):
    { proxyServer: string | undefined, proxyBypassList: string | undefined } | null {
    const proxyServer = PROXY_ENV_VAR_NAMES.map(n => env[n])
                                           .find(v => !!v);
    if (!proxyServer) {
        return null;
    }
    const proxyBypassList = getProxyBypassRules(env);
    return {proxyServer, proxyBypassList};
}

export function getSessionProxyConfig(env?: { [name: string]: string }):
    { pacScript: string, proxyRules: string, proxyBypassRules: string } | null {
    const proxyRules = Array.from(new Set(PROXY_ENV_VAR_NAMES.map(n => env[n])
                                                             .filter(v => !!v))).join(';');
    if (!proxyRules) {
        return null;
    }
    const proxyBypassRules = getProxyBypassRules(env);
    return {pacScript: '', proxyRules, proxyBypassRules};
}

function getProxyBypassRules(env?: { [name: string]: string }) {
    let noProxyHostsSet = new Set();
    NO_PROXY_ENV_VAR_NAMES.map(n => env[n])
                          .filter(v => !!v)
                          .forEach(noProxy => {
                              let noProxyHosts = noProxy.split(',');
                              if (noProxyHosts.length === 1) {
                                  noProxyHosts = noProxy.split(';');
                              }
                              noProxyHosts.map(h => h.trim())
                                          .filter(h => !!h)
                                          .forEach(noProxyHost => noProxyHostsSet.add(noProxyHost));
                          });
    ['localhost', '127.0.0.1', '::1'].forEach(host => noProxyHostsSet.delete(host));
    return ['<local>', 'dev.virtualearth.net'].concat(Array.from(noProxyHostsSet)).join(';')
}
