import * as path from 'path';
import * as os from 'os';
import {existsFile, execFile, deleteFile, downloadFile, FileExecOutput} from './fileutil';
import {URL} from "url";

import {
    RequirementSet,
    Requirement,
    RequirementContext,
    RequirementProgressHandler, RequirementState
} from './requirement';
import {isNumber} from "../common/types";


function _getOutput(output: FileExecOutput) {
    // Note "python --version" outputs to stderr!
    return ((output.stdout && output.stdout !== '') ? output.stdout : output.stderr) || '';
}


export class DownloadMiniconda extends Requirement {

    constructor() {
        super('DownloadMiniconda', [], 'Download Miniconda');
    }

    getMinicondaInstallerUrl(): string {
        const platform = process.platform;
        if (platform === "win32") {
            return "https://repo.continuum.io/miniconda/Miniconda3-latest-Windows-x86_64.exe";
        } else if (platform === "darwin") {
            return "https://repo.continuum.io/miniconda/Miniconda3-latest-MacOSX-x86_64.sh";
        } else if (platform === "linux") {
            return "https://repo.continuum.io/miniconda/Miniconda3-latest-Linux-x86_64.sh";
        }
        throw new Error(`${this.name}: platform "${platform}" is not supported`);
    }

    getMinicondaInstallerExecutable(): string {
        const sourceUrl = new URL(this.getMinicondaInstallerUrl());
        const pos = sourceUrl.pathname.lastIndexOf('/');
        return pos >= 0 ? sourceUrl.pathname.slice(pos + 1) : sourceUrl.pathname;
    }

    newInitialState(context: RequirementContext): RequirementState {
        return {
            minicondaInstallerUrl: this.getMinicondaInstallerUrl(),
            minicondaInstallerExecutable: this.getMinicondaInstallerExecutable(),
        };
    }

    fulfilled(context: RequirementContext, onProgress: RequirementProgressHandler): Promise<boolean> {
        return existsFile(this.getMinicondaInstallerExecutable());
    }

    fulfill(context: RequirementContext, onProgress: RequirementProgressHandler): Promise<any> {
        const targetFile = this.getMinicondaInstallerExecutable();
        let progressHandler = (bytesReceived: number, bytesTotal: number) => {
            const percent = Math.round(100 * bytesReceived / bytesTotal);
            onProgress({message: `Downloading ${targetFile}: ${bytesReceived} of ${bytesTotal} bytes received, ${percent}%`});
        };
        return downloadFile(this.getMinicondaInstallerUrl(), targetFile, progressHandler);
    }

    rollback(context: RequirementContext, onProgress: RequirementProgressHandler): Promise<any> {
        return deleteFile(this.getMinicondaInstallerExecutable(), true);
    }
}


export class InstallMiniconda extends Requirement {
    minicondaInstallDir: string;

    constructor(minicondaInstallDir: string) {
        super('InstallMiniconda', ['DownloadMiniconda'], 'Install Miniconda');
        this.minicondaInstallDir = minicondaInstallDir;
    }

    getMinicondaInstallerArgs() {
        if (process.platform === "win32") {
            return ['/S', '/InstallationType=JustMe', '/AddToPath=0', '/RegisterPython=0', `/D=${this.minicondaInstallDir}`];
        } else {
            return ['-b', '-f', '-p', this.minicondaInstallDir];
        }
    }

    getPythonExecutable() {
        return getCondaPythonExecutable(this.minicondaInstallDir);
    }

    newInitialState(context: RequirementContext): RequirementState {
        return {
            minicondaInstallDir: this.minicondaInstallDir,
            minicondaInstallerArgs: this.getMinicondaInstallerArgs(),
            pythonExecutable: this.getPythonExecutable(),
        };
    }

    fulfilled(context: RequirementContext, onProgress: RequirementProgressHandler): Promise<boolean> {
        const pythonExecutable = this.getPythonExecutable();
        return execFile(pythonExecutable, ['--version']).then((output: FileExecOutput) => {
            const line = _getOutput(output);
            return line.startsWith("Python 3.");
        }).catch(() => {
            return false;
        });
    }

    fulfill(context: RequirementContext, onProgress: RequirementProgressHandler): Promise<any> {
        const minicondaInstallerExecutable = context.getRequirementState('DownloadMiniconda').minicondaInstallerExecutable;
        this.getState(context).minicondaInstalled = true;
        return execFile(minicondaInstallerExecutable, this.getMinicondaInstallerArgs(), onProgress);
    }

    rollback(context: RequirementContext, onProgress: RequirementProgressHandler): Promise<any> {
        if (this.getState(context).minicondaInstalled) {
            // const minicondaInstallDir = this.minicondaInstallDir;
            // deleteInstallDir
        }
        return Promise.resolve();
    }
}

export class InstallCondaEnv extends Requirement {
    condaDir: string;

    constructor(condaDir: string) {
        super('InstallOrUpdateCate', [], 'Installing Conda environment');
        this.condaDir = condaDir;
    }

    getCondaDir() {
        return this.condaDir;
    }

    getCondaExecutable() {
        return getCondaExecutable(this.getCondaDir());
    }

    getCondaEnvDir() {
        return path.join(this.getCondaDir(), "envs", "cate-env");
    }

    getEnvPythonExecutable() {
        return getCondaPythonExecutable(this.getCondaEnvDir());
    }

    newInitialState(context: RequirementContext): RequirementState {
        return {
            condaDir: this.condaDir,
        };
    }

    fulfilled(context: RequirementContext, onProgress: RequirementProgressHandler): Promise<boolean> {
        const pythonExecutable = this.getEnvPythonExecutable();
        return execFile(pythonExecutable, ['--version']).then((output: FileExecOutput) => {
            const line = _getOutput(output);
            return line.startsWith("Python 3.");
        }).catch(() => {
            return false;
        });
    }

    fulfill(context: RequirementContext, onProgress: RequirementProgressHandler): Promise<any> {
        const condaExecutable = this.getCondaExecutable();
        return execFile(condaExecutable, ['conda', 'env', 'create', '-n', 'cate-env', 'python=3'], onProgress);
    }
}

export class InstallOrUpdateCate extends Requirement {
    cateVersion: string;
    cateDir: string;

    constructor(cateVersion: string, cateDir: string, requires: string[]) {
        super('InstallOrUpdateCate', requires, 'Install or update to cate-' + cateVersion);
        this.cateVersion = cateVersion;
        this.cateDir = cateDir;
    }

    // noinspection JSMethodCanBeStatic
    getCateDir() {
        return this.cateDir;
    }

    getCateCliExecutable() {
        return getCateCliExecutable(this.getCateDir());
    }

    getCondaExecutable() {
        return getCondaExecutable(this.getCateDir());
    }

    newInitialState(context: RequirementContext): RequirementState {
        return {
            cateVersion: this.cateVersion,
            cateDir: this.getCateDir(),
        };
    }

    fulfilled(context: RequirementContext, onProgress: RequirementProgressHandler): Promise<boolean> {
        const cateCliExecutable = this.getCateCliExecutable();
        return execFile(cateCliExecutable, ['cate', '--version']).then((output: FileExecOutput) => {
            const line = _getOutput(output);
            return line.startsWith(this.cateVersion);
        }).catch(() => {
            return false;
        });
    }

    fulfill(context: RequirementContext, onProgress: RequirementProgressHandler): Promise<any> {
        const condaExecutable = this.getCondaExecutable();
        return execFile(condaExecutable, ['install', '--yes', '-c', 'ccitools', '-c', 'conda-forge', 'cate-cli=' + this.cateVersion], onProgress);
    }
}

// TODO (nf): call this function from main.ts when there is no Cate CLI yet or if it's WebAPI version is out-of-date.
export function updateCateCli() {
    //const minicondaInstallDir = path.join(os.homedir(), 'cate-test-1');
    const minicondaInstallDir = 'D:\\cate-test-2';
    const cateVersion = '1.0.1.dev1';

    let downloadMiniconda = new DownloadMiniconda();
    let installMiniconda = new InstallMiniconda(minicondaInstallDir);
    let installOrUpdateCate = new InstallOrUpdateCate(cateVersion, minicondaInstallDir, [installMiniconda.id]);
    let requirementSet = new RequirementSet([downloadMiniconda,
                                             installMiniconda,
                                             installOrUpdateCate]);
    let done = false;
    requirementSet.fulfillRequirement(installOrUpdateCate.id, progress => {
        console.log(progress);
        done = isNumber(progress.worked) && progress.worked === progress.totalWork;
    }).then(() => {
        console.log('Cate CLI updated successfully.')
    }).catch(reason => {
        console.error('Failed to update Cate CLI due to the following error:');
        console.error(reason);
    });
}

// noinspection JSUnusedGlobalSymbols
export function run() {
    updateCateCli();
}

function getCondaPythonExecutable(condaDir: string) {
    if (process.platform === "win32") {
        return path.join(condaDir, 'python.exe');
    } else {
        return path.join(condaDir, 'bin', 'python');
    }
}

function getCondaExecutable(condaDir: string) {
    if (process.platform === "win32") {
        return path.join(condaDir, 'Scripts', 'conda.exe');
    } else {
        return path.join(condaDir, 'bin', 'conda');
    }
}

function getCateCliExecutable(condaDir: string) {
    if (process.platform === "win32") {
        return path.join(condaDir, 'Scripts', 'cate-cli.bat');
    } else {
        return path.join(condaDir, 'bin', 'cate-cli.sh');
    }
}
