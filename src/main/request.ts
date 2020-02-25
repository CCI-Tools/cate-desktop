const http = require('http');
const https = require('https');

/**
 * The error type reported by the "request" function.
 */
export class HttpError extends Error {
    readonly code: number;

    constructor(message: string, code: number) {
        super(message);
        this.code = code;
    }
}


/**
 * Usage:
 *
 * <pre>
 *     request('https://www.random.org/integers/?num=1&min=1&max=100&col=1&base=10&format=plain&rnd=new')
 *     .then((html) => log.info(html))
 *     .catch((err) => log.error(err));
 * </pre>
 *
 * JavaScript version stolen from from https://www.tomas-dvorak.cz/posts/nodejs-request-without-dependencies/.
 *
 * @param url The URL to request data from
 * @param timeout the timeout in milliseconds
 * @returns {Promise<string>}
 */
export function request(url: string, timeout = 1000): Promise<string> {
    // return new pending promise
    function requestExecutor(resolve: (response: string) => void, reject: (err: HttpError) => void) {
        function httpGetCallback(response) {
            // handle http errors
            if (response.statusCode < 200 || response.statusCode > 299) {
                reject(new HttpError(`Failed to get data from "${url}", status code ${response.statusCode}`, response.statusCode));
            }
            // temporary data holder
            const body = [];
            // on every content chunk, push it to the data array
            response.on('data', (chunk) => body.push(chunk));
            // we are done, resolve promise with those joined chunks
            response.on('end', () => resolve(body.join('')));
        }

        // select http or https module, depending on reqested url
        const lib = url.startsWith('https') ? https : http;
        const request = lib.get(url, httpGetCallback);
        request.setTimeout(timeout);
        // handle connection errors of the request
        request.on('error', (err) => reject(err));
    }

    return new Promise<string>(requestExecutor);
}
