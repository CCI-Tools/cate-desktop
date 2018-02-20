import * as electron from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as semver from "semver";
import {pep440ToSemver} from "../common/version";
import {SETUP_REASON_INSTALL_CATE, SETUP_REASON_UPDATE_CATE, SetupInfo, SetupReason} from "../common/setup";
import * as assert from "../common/assert";
import * as child_process from "child_process";


/**
 * Identifies the required version of the Cate WebAPI.
 * The value is a SemVer (https://github.com/npm/semver) compatible version range string.
 * @type {string}
 */
export const APP_CLI_VERSION_RANGE = ">=1.1.0-dev.1 <1.2.0";

/**
 * Version of cate-cli that is know to run with this version of Cate Desktop.
 * Note the version name must be compatible with PEP-440 and a cate-cli package
 * with that version should have been deployed.
 * @type {string}
 */
export const EXPECTED_APP_CLI_VERSION = "1.1.0.dev1";


export const CATE_CLI_EXECUTABLE = (() => {
    if (process.platform === 'win32') {
        return "Scripts\\cate-cli.bat";
    } else {
        return "bin/cate-cli";
    }
})();

export const CONDA_EXECUTABLES = (() => {
    if (process.platform === 'win32') {
        return ["python.exe", "Scripts\\activate.bat", "Scripts\\deactivate.bat"];
    } else {
        return ["bin/python", "bin/activate", "bin/deactivate"];
    }
})();

export const CATE_EXECUTABLES = (() => {
    return [CATE_CLI_EXECUTABLE].concat(CONDA_EXECUTABLES);
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

export function getCateCliPath(cateDir?: string): string {
    return path.join(cateDir || getCateDir(), CATE_CLI_EXECUTABLE);
}

export function getCateDir() {
    assert.ok(_cateDir && _cateDir !== "", "internal error: _cateDir=" + _cateDir);
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
                const cateCliExe = path.join(oldCateDir, CATE_CLI_EXECUTABLE);
                if (isExec(cateCliExe)) {
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


export function getCateCliVersion(): Promise<string> {
    const cateDir = getCateDir();
    let command;
    if (process.platform === 'win32') {
        command = `"${cateDir}\\Scripts\\activate" "${cateDir}" & "${cateDir}\\python" -c "import cate; print(cate.__version__)"`;
    } else {
        command = `"${cateDir}/bin/activate" "${cateDir}"; "${cateDir}/python" -c "import cate; print(cate.__version__)"`;
    }
    return new Promise((resolve, reject) => {
        child_process.exec(command,
                           (error: Error | null, stdout: string, stderr: string) => {
                               if (error) {
                                   reject(error);
                               }
                               if (!stdout || stdout === "") {
                                   reject(new Error("no version available"));
                               } else {
                                   resolve(stdout);
                               }
                           });
    });
}
