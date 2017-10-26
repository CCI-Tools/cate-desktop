import * as child_process from 'child_process';
import * as path from 'path';
import * as os from 'os';
import {existsFile, execFile, deleteFile, downloadFile} from './fileutil';

import {
    RequirementSet,
    Requirement,
    RequirementContext,
    RequirementProgressHandler, RequirementState
} from './requirement';

class DownloadMiniconda extends Requirement {

    private static WIN_URL = "https://repo.continuum.io/miniconda/Miniconda3-latest-Windows-x86_64.exe";
    private static WIN_FILE = "miniconda-installer.exe";

    constructor() {
        super('DownloadMiniconda', [], 'Download Miniconda');
    }

    // noinspection JSMethodCanBeStatic
    getSourceUrl() {
        return DownloadMiniconda.WIN_URL;
    }

    // noinspection JSMethodCanBeStatic
    getTargetFile() {
        return DownloadMiniconda.WIN_FILE;
    }

    newInitialState(context: RequirementContext): RequirementState {
        return {
            sourceUrl: this.getSourceUrl(),
            targetFile: this.getTargetFile(),
        };
    }

    fulfilled(context: RequirementContext, onProgress: RequirementProgressHandler): Promise<boolean> {
        return existsFile(this.getTargetFile());
    }

    fulfill(context: RequirementContext, onProgress: RequirementProgressHandler): Promise<any> {
        const targetFile = this.getTargetFile();
        let progressHandler = (bytesReceived: number, bytesTotal: number) => {
            const percent = Math.round(100 * bytesReceived / bytesTotal);
            onProgress({message: `Downloading ${targetFile}: ${bytesReceived} of ${bytesTotal} bytes received, ${percent}%`});
        };
        return downloadFile(this.getSourceUrl(), targetFile, progressHandler);
    }

    rollback(context: RequirementContext, onProgress: RequirementProgressHandler): Promise<any> {
        return deleteFile(this.getTargetFile(), true);
    }
}


class InstallMiniconda extends Requirement {
    installDir: string;

    constructor(installDir: string) {
        super('InstallMiniconda', ['DownloadMiniconda'], 'Install Miniconda');
        this.installDir = installDir;
    }

    getPythonExecutable() {
        return path.join(this.installDir, 'python.exe');
    }

    newInitialState(context: RequirementContext): RequirementState {
        return {
            installDir: this.installDir,
            pythonExecutable: this.getPythonExecutable(),
        };
    }

    fulfilled(context: RequirementContext, onProgress: RequirementProgressHandler): Promise<boolean> {
        const pythonExecutable = this.getPythonExecutable();
        return new Promise<boolean>((resolve) => {
            child_process.execFile(pythonExecutable, ['--version'], (error: Error, stdout: string) => {
                resolve(!error && !!(stdout && stdout.startsWith("Python 3.") && stdout.endsWith('Anaconda, Inc.')));
            });
        });
    }

    fulfill(context: RequirementContext, onProgress: RequirementProgressHandler): Promise<any> {
        const installDir = this.installDir;
        const installerFile = context.getRequirementState('DownloadMiniconda').targetFile;
        this.getState(context).installed = true;
        return execFile(installerFile, ['/S', '/InstallationType=JustMe', '/AddToPath=0', '/RegisterPython=0', `/D=${installDir}`], onProgress);
    }

    rollback(context: RequirementContext, onProgress: RequirementProgressHandler): Promise<any> {
        if (this.getState(context).installed) {
            // const installDir = this.installDir;
            // deleteInstallDir
        }
        return Promise.resolve();
    }
}

class InstallOrUpdateCate extends Requirement {
    cateVersion: string;

    constructor(cateVersion: string) {
        super('InstallOrUpdateCate', ['InstallMiniconda'], 'Install Cate or update Cate to version ' + cateVersion);
        this.cateVersion = cateVersion;
    }

    // noinspection JSMethodCanBeStatic
    getInstallDir(context: RequirementContext) {
        return context.getRequirementState('InstallMiniconda').installDir;
    }

    getCateCliExecutable(context: RequirementContext) {
        return path.join(this.getInstallDir(context), 'Scripts', 'cate-cli.bat');
    }

    getCondaExecutable(context: RequirementContext) {
        return path.join(this.getInstallDir(context), 'Scripts', 'conda.exe');
    }

    newInitialState(context: RequirementContext): RequirementState {
        return {
            cateVersion: this.cateVersion,
            installDir: this.getInstallDir(context),
            cateCliExecutable: this.getCateCliExecutable(context),
            condaExecutable: this.getCondaExecutable(context),
        };
    }

    fulfilled(context: RequirementContext, onProgress: RequirementProgressHandler): Promise<boolean> {
        const cateCliExecutable = this.getCateCliExecutable(context);
        return new Promise<boolean>((resolve) => {
            child_process.execFile(cateCliExecutable, ['cate', '--version'], (error: Error, stdout: string) => {
                resolve(!error && stdout === 'cate ' + this.cateVersion);
            });
        });
    }

    fulfill(context: RequirementContext, onProgress: RequirementProgressHandler): Promise<any> {
        const condaExecutable = this.getCondaExecutable(context);
        return execFile(condaExecutable, ['install', '--yes', '-c', 'ccitools', '-c', 'conda-forge', 'cate-cli'], onProgress);
    }
}


export function run() {
    let downloadMiniconda = new DownloadMiniconda();
    let installMiniconda = new InstallMiniconda(path.join(os.homedir(), 'cate-test-1'));
    let installOrUpdateCate = new InstallOrUpdateCate('1.0.0');
    let requirementSet = new RequirementSet(downloadMiniconda,
                                            installMiniconda,
                                            installOrUpdateCate);
    requirementSet.fulfillRequirement(installOrUpdateCate.id, progress => {
        console.log(progress);
    }).then(() => {
        console.log('OK!')
    }).catch(reason => {
        console.error(reason)
    });
}
