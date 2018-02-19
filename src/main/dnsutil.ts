import * as dns from "dns";
import {FileExecOutput} from "./fileutil";


const DEFAULT_HOST_NAMES = ["google.com", "microsoft.com", "apple.com", "amazon.com", "github.com"];

/**
 * Check if there is an internet connection.
 * We do this by looking up well-known DNS names, such as "google.com" or "microsoft.com".
 * If any of these resolve, we assume we have an internet connection.
 *
 * @param {(isConnected: boolean) => any} callback
 * @param hostNames optional host name list
 */
export function checkInternet(callback: (isConnected: boolean) => any, hostNames?: string[]) {

    hostNames = hostNames || DEFAULT_HOST_NAMES;

    function checkHost(index: number) {
        if (index === hostNames.length) {
            callback(false);
        } else {
            dns.lookup(hostNames[index],(err) => {
                if (err && err.code === "ENOTFOUND") {
                    checkHost(index + 1);
                } else {
                    callback(true);
                }
            });
        }
    }

    checkHost(0);
}

export function ifInternet(hostNames?: string[]): Promise<boolean> {
    return new Promise<boolean>((resolve: (isConnected: boolean) => any, reject: (error: Error) => any) => {
        checkInternet((isConnected: boolean) => {
            if (isConnected) {
                resolve(true);
            } else {
                reject(new Error("No internet connection"));
            }
        }, hostNames);
    }, );
}
