import * as electron from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as semver from "semver";
import {pep440ToSemver} from "../common/version";


/**
 * Identifies the required version of the Cate WebAPI.
 * The value is a SemVer (https://github.com/npm/semver) compatible version range string.
 * @type {string}
 */
// export const APP_CLI_VERSION_RANGE = ">=0.9.0-dev.5 <=0.9.0-dev.7";
export const APP_CLI_VERSION_RANGE = ">=1.1.0-dev.1 <1.2.0";


const app = electron.app;

let _appCliLocation = null;

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

export function getAppCliLocation() {
    if (!_appCliLocation) {
        _appCliLocation = _getAppCliLocation();
    }
    return _appCliLocation;
}

function _getAppCliLocation() {
    const dataDir = getAppDataDir();
    if (!fs.existsSync(dataDir)) {
        // Return immediately if there is no dataDir (yet).
        return null;
    }

    const fileNames = fs.readdirSync(dataDir);
    const cliLocations = {};
    for (let fileName of fileNames) {
        const version = pep440ToSemver(fileName);
        if (semver.valid(version, true)) {
            const locationFile = path.join(dataDir, fileName, 'cate.location');
            let location;
            try {
                location = fs.readFileSync(locationFile, 'utf8').trim();
            } catch (err) {
                continue;
            }
            const cateCliExe = getCateCliPath(location);
            if (isExec(cateCliExe)) {
                // Return immediately if the versions are equal.
                if (semver.eq(version, app.getVersion(), true)) {
                    return cateCliExe;
                }
                cliLocations[version] = cateCliExe;
            }
        }
    }

    // We use descending version names, so we always pick the highest compatible version
    let descendingVersions = Object.getOwnPropertyNames(cliLocations);
    descendingVersions.sort((v1: string, v2: string) => semver.compare(v2, v1, true));

    for (let version of descendingVersions) {
        if (semver.satisfies(version, APP_CLI_VERSION_RANGE, true)) {
            return cliLocations[version];
        }
    }

    return null;
}

export function getCateCliPath(dirPath: string): string {
    return path.join(dirPath, process.platform === 'win32' ? 'Scripts\\cate-cli.bat' : 'bin/cate-cli');
}

function isExec(path: string): boolean {
    try {
        fs.accessSync(path, fs.constants.X_OK);
        return true;
    } catch (err) {
        return false;
    }
}

