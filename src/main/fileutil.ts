import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as child_process from "child_process";


/**
 * Execute a file.
 *
 * @param {string} file
 * @param {string[]} args
 * @param progress Called while executing the process. Signature: (bytesReceived: number, bytesTotal: number) => void
 * @returns {Promise<number>}
 */
export function execFile(file: string, args: string[], progress): Promise<number> {
    return new Promise<number>((resolve: (code: number) => any, reject: (error: Error) => any) => {
        progress({message: `running ${file} ` + args.map(a => a.indexOf(' ') >= 0 ? `"${a}"` : a).join(' ')});
        const child = child_process.execFile(file, args);
        child.stdout.on('data', (data) => {
            progress({stdout: data});
        });
        child.stderr.on('data', (data) => {
            progress({stderr: data});
        });
        child.on('close', (code) => {
            resolve(code);
        });
        child.on('error', (error: Error) => {
            reject(error);
        });
    });
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
 * @param progress Called while downloading. Signature: (bytesReceived: number, bytesTotal: number) => void
 */
export function downloadFile(sourceUrl: string,
                             targetFile: string,
                             progress: (bytesReceived: number, bytesTotal: number) => void): Promise<void> {

    return new Promise<void>((resolve, reject) => {
        const tempDestFile = targetFile + ".download";
        const file = fs.createWriteStream(tempDestFile);
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
                    fs.rename(tempDestFile, targetFile, (e: Error) => {
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
                fs.unlink(targetFile);
                reject(e);
            });
        };

        let request;
        if (sourceUrl.startsWith("https:")) {
            request = https.get(sourceUrl, resHandler);
        } else {
            request = http.get(sourceUrl, resHandler);
        }

        request.on("error", function (e: Error) {
            fs.unlink(targetFile);
            reject(e);
        });
    });

}

