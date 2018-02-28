import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import {exec, ExecOptions, spawn, SpawnOptions} from "child_process";

export interface ExecOutput {
    stdout?: string;
    stderr?: string;
}


/**
 * Check if a file exists.
 *
 * @param {string} file
 * @returns {Promise<boolean>}
 */
export function existsFile(file: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        fs.exists(file, resolve);
    });
}


/**
 * Delete a file.
 *
 * @param {string} file
 * @param {boolean} ignoreFailure
 * @returns {Promise<boolean>}
 */
export function deleteFile(file: string, ignoreFailure?: boolean): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        fs.exists(file, (exists) => {
            if (exists) {
                fs.unlink(file, (e: Error) => {
                    if (e) {
                        if (ignoreFailure) {
                            resolve(false);
                        } else {
                            reject(e);
                        }
                    } else {
                        resolve(true);
                    }
                });
            } else {
                resolve(false);
            }
        });
    });
}

/**
 * Download a file.
 *
 * @param sourceUrl The URL
 * @param targetFile The local file
 * @param targetMode The access mode of the target file. e.g. 0o777
 * @param progress Called while downloading. Signature: (bytesReceived: number, bytesTotal: number) => void
 */
export function downloadFile(sourceUrl: string,
                             targetFile: string,
                             targetMode: number,
                             progress: (bytesReceived: number, bytesTotal: number) => void): Promise<void> {

    return new Promise<void>((resolve, reject) => {
        const tempTargetFile = targetFile + ".download";
        const file = fs.createWriteStream(tempTargetFile, {mode: targetMode});
        let time = process.hrtime();
        const resHandler = (res: http.IncomingMessage) => {
            const bytesTotal = parseInt(res.headers['content-length'] as string);
            let bytesReceived = 0;
            res.pipe(file);
            res.on("data", function (chunk) {
                bytesReceived += chunk.length;
                if (progress) {
                    const time2 = process.hrtime(time);
                    if (time2[0] >= 1) {
                        time = time2;
                        progress(bytesReceived, bytesTotal);
                    }
                }
            });
            res.on("end", function () {
                file.once("close", () => {
                    fs.rename(tempTargetFile, targetFile, (e: Error) => {
                        if (e) {
                            reject(e);
                        } else {
                            resolve();
                        }
                    });
                });
                file.close();
            });
            res.on("error", function (e: Error) {
                fs.unlink(targetFile, () => reject(e));
            });
        };

        let request;
        if (sourceUrl.startsWith("https:")) {
            request = https.get(sourceUrl as any, resHandler);
        } else {
            request = http.get(sourceUrl, resHandler);
        }

        request.on("error", function (e: Error) {
            fs.unlink(targetFile, () => reject(e));
        });
    });
}

export function execAsync(command: string, options?: ExecOptions): Promise<ExecOutput> {
    return new Promise<{ stdout: string, stderr: string }>((resolve, reject) => {
        let callback = (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve({stdout, stderr});
            }
        };
        if (options) {
            exec(command, options, callback);
        } else {
            exec(command, callback);
        }
    });
}

export function spawnAsync(command: string, args: undefined | string[], options: undefined | SpawnOptions, onProgress: (progress: ExecOutput) => any): Promise<number> {
    return new Promise<number>((resolve: (code: number) => any, reject: (error: Error) => any) => {
        let child;
        if (args && options) {
            child = spawn(command, args, options);
        } else if (options) {
            child = spawn(command, [], options);
        } else if (args) {
            child = spawn(command, args);
        } else {
            child = spawn(command);
        }
        child.stdout.on('data', (data) => {
            onProgress({stdout: data.toString()});
        });
        child.stderr.on('data', (data) => {
            onProgress({stderr: data.toString()});
        });
        child.on('close', (code) => {
            resolve(code);
        });
        child.on('error', (error: Error) => {
            reject(error);
        });
    });
}

