import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as child_process from "child_process";

export interface FileExecOutput {
    message?: string;
    stdout?: string;
    stderr?: string;
}

/**
 * Execute a file.
 *
 * @param {string} file
 * @param {string[]} args
 * @param onProgress Called while executing the process. Signature: (progress: any) => any
 * @returns {Promise<number | FileExecOutput>}
 */
export function execFile(file: string, args: string[], onProgress?: (progress: any) => any): Promise<number | FileExecOutput> {
    const message = `running ${file} ` + args.map(a => a.indexOf(' ') >= 0 ? `"${a}"` : a).join(' ');
    if (onProgress) {
        return new Promise<number>((resolve: (code: number) => any, reject: (error: Error) => any) => {
            onProgress({message});
            const child = child_process.spawn(file, args);
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
    } else {
        return new Promise<FileExecOutput>((resolve: (output: FileExecOutput) => any, reject: (error: Error) => any) => {
            child_process.execFile(file, args, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({message, stdout, stderr});
                }
            });
        });
    }
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
        const resHandler = (res: http.IncomingMessage) => {
            const bytesTotal = parseInt(res.headers['content-length'] as string);
            let bytesReceived = 0;
            res.pipe(file);
            res.on("data", function (chunk) {
                bytesReceived += chunk.length;
                if (progress) {
                    progress(bytesReceived, bytesTotal);
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

