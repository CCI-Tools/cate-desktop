import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {URL} from "url";
import {existsFile, deleteFile, downloadFile, ExecOutput, spawnAsync, execAsync} from './fileutil';
import {
    Transaction,
    TransactionContext,
    TransactionProgressHandler, TransactionState
} from '../common/transaction';


function _getOutput(output: ExecOutput) {
    // Note "python --version" outputs to stderr! (Conda bug?)
    return ((output.stdout && output.stdout !== '') ? output.stdout : output.stderr) || '';
}


export class DownloadMiniconda extends Transaction {

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

    getMinicondaInstallerExecutable(context: TransactionContext): string {
        const state = this.getState(context);
        let minicondaInstallerExecutable = state.minicondaInstallerExecutable;
        if (!minicondaInstallerExecutable) {
            const sourceUrl = new URL(this.getMinicondaInstallerUrl());
            const pos = sourceUrl.pathname.lastIndexOf('/');
            const fileName = pos >= 0 ? sourceUrl.pathname.slice(pos + 1) : sourceUrl.pathname;
            const tmpDir = os.tmpdir();
            minicondaInstallerExecutable = path.join(fs.mkdtempSync(`${tmpDir}${path.sep}cate-`), fileName);
            state.minicondaInstallerExecutable = minicondaInstallerExecutable;
        }
        return minicondaInstallerExecutable;
    }

    newInitialState(context: TransactionContext): TransactionState {
        return {
            minicondaInstallerUrl: this.getMinicondaInstallerUrl(),
            minicondaInstallerExecutable: null,
        };
    }

    fulfilled(context: TransactionContext, onProgress: TransactionProgressHandler): Promise<boolean> {
        return existsFile(this.getMinicondaInstallerExecutable(context));
    }

    fulfill(context: TransactionContext, onProgress: TransactionProgressHandler): Promise<any> {
        const targetFile = this.getMinicondaInstallerExecutable(context);
        let progressHandler = (bytesReceived: number, bytesTotal: number) => {
            const subWorked = bytesReceived / bytesTotal;
            const percent = Math.round(100 * subWorked);
            const message = `${targetFile}: ${bytesReceived} of ${bytesTotal} bytes received, ${percent}%`;
            onProgress({message, subWorked});
        };
        return downloadFile(this.getMinicondaInstallerUrl(), targetFile, 0o777, progressHandler);
    }

    rollback(context: TransactionContext, onProgress: TransactionProgressHandler): Promise<any> {
        return deleteFile(this.getMinicondaInstallerExecutable(context), true);
    }
}


export class InstallMiniconda extends Transaction {
    minicondaInstallDir: string;

    constructor(minicondaInstallDir: string) {
        super('InstallMiniconda', ['DownloadMiniconda'], 'Install Miniconda');
        this.minicondaInstallDir = minicondaInstallDir;
    }

    newInitialState(context: TransactionContext): TransactionState {
        return {
            minicondaInstallDir: this.minicondaInstallDir,
        };
    }

    fulfilled(context: TransactionContext, onProgress: TransactionProgressHandler): Promise<boolean> {
        return isCompatiblePython(this.minicondaInstallDir, this.minicondaInstallDir, onProgress);
    }

    fulfill(context: TransactionContext, onProgress: TransactionProgressHandler): Promise<any> {
        let args;
        if (process.platform === "win32") {
            args = ['/S', '/InstallationType=JustMe', '/AddToPath=0', '/RegisterPython=0', `/D=${this.minicondaInstallDir}`];
        } else {
            args = ['-b', '-f', '-p', this.minicondaInstallDir];
        }
        const minicondaInstallerExecutable = context.getTransactionState('DownloadMiniconda').minicondaInstallerExecutable;
        this.getState(context).minicondaInstalled = true;
        notifyExecFile(minicondaInstallerExecutable, args, onProgress);
        return spawnAsync(minicondaInstallerExecutable, args, defaultSpawnShellOption(), onProgress);
    }

    rollback(context: TransactionContext, onProgress: TransactionProgressHandler): Promise<any> {
        if (this.getState(context).minicondaInstalled) {
            // const minicondaInstallDir = this.minicondaInstallDir;
            // deleteInstallDir
        }
        return Promise.resolve();
    }
}

export class InstallCondaEnv extends Transaction {
    condaDir: string;

    constructor(condaDir: string) {
        super('InstallCondaEnv', [], 'Installing Conda environment');
        this.condaDir = condaDir;
    }

    getCondaDir() {
        return this.condaDir;
    }

    getCondaEnvDir() {
        return path.join(this.getCondaDir(), "envs", "cate-env");
    }

    newInitialState(context: TransactionContext): TransactionState {
        return {
            condaDir: this.condaDir,
        };
    }

    fulfilled(context: TransactionContext, onProgress: TransactionProgressHandler): Promise<boolean> {
        return isCompatiblePython(this.getCondaDir(), this.getCondaEnvDir(), onProgress);
    }

    fulfill(context: TransactionContext, onProgress: TransactionProgressHandler): Promise<any> {
        const command = getCommandInActivatedCondaEnv(this.getCondaDir(), this.getCondaDir(), "conda env create --name cate-env python=3");
        notifyExecCommand(command, onProgress);
        return spawnAsync(command, undefined, defaultSpawnShellOption(), onProgress);
    }
}

export class InstallOrUpdateCate extends Transaction {
    cateVersion: string;
    cateDir: string;

    constructor(cateVersion: string, cateDir: string, requires: string[]) {
        super('InstallOrUpdateCate', requires, 'Install or update to cate-' + cateVersion);
        this.cateVersion = cateVersion;
        this.cateDir = cateDir;
    }

    getCateDir() {
        return this.cateDir;
    }

    newInitialState(context: TransactionContext): TransactionState {
        return {
            cateVersion: this.cateVersion,
            cateDir: this.getCateDir(),
        };
    }

    fulfilled(context: TransactionContext, onProgress: TransactionProgressHandler): Promise<boolean> {
        const command = getCommandInActivatedCondaEnv(this.getCateDir(), this.getCateDir(), "cate --version");
        notifyExecCommand(command, onProgress);
        return execAsync(command, defaultExecShellOption()).then((output: ExecOutput) => {
            const line = _getOutput(output);
            return line.startsWith(this.cateVersion);
        }).catch(() => {
            return false;
        });
    }

    fulfill(context: TransactionContext, onProgress: TransactionProgressHandler): Promise<any> {
        const command = getCommandInActivatedCondaEnv(this.getCateDir(), this.getCateDir(), `conda install --yes -c ccitools -c conda-forge cate-cli=${this.cateVersion}`);
        notifyExecCommand(command, onProgress);
        return spawnAsync(command, undefined, defaultSpawnShellOption(), onProgress)
            .then(code => this.fulfilled(context, onProgress))
            .then(ok => {
                if (!ok) {
                    throw new Error("Cate setup failed!");
                }
            });
    }
}

function isCompatiblePython(condaDir: string, condaEnvDir: string, onProgress: TransactionProgressHandler): Promise<boolean> {
    const command = getCommandInActivatedCondaEnv(condaDir, condaEnvDir, "python --version");
    notifyExecCommand(command, onProgress);
    return execAsync(command, defaultExecShellOption()).then((output: ExecOutput) => {
        const line = _getOutput(output);
        return line.startsWith("Python 3.");
    }).catch(() => {
        return false;
    });
}


function getCommandInActivatedCondaEnv(condaDir: string, envDir: string, command: string) {
    if (process.platform === 'win32') {
        const activatePath = path.join(condaDir, "Scripts", "activate");
        return `"${activatePath}" "${envDir}" & ${command}`;
    } else {
        const activatePath = path.join(condaDir, "bin", "activate");
        return `source "${activatePath}" "${envDir}"; ${command}`;
    }
}

function notifyExecCommand(command: string, onProgress: TransactionProgressHandler) {
    onProgress({message: command});
}

function notifyExecFile(file: string, args: string[], onProgress: TransactionProgressHandler) {
    onProgress({message: `${file} ` + args.map(a => a.indexOf(' ') >= 0 ? `"${a}"` : a).join(' ')});
}

// on Unix '/bin/sh' is the dafault
// BUT on Ubuntu this links to 'dash' which doesn't work together with 'conda'
function defaultSpawnShellOption() {
    if (process.platform === "win32") {
        return {shell: true};
    } else {
        return {shell: '/bin/bash'};
    }
}

function defaultExecShellOption() {
    if (process.platform !== "win32") {
        return {shell: '/bin/bash'};
    }
}
