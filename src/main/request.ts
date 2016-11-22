/**
 * Usage:
 *
 * <pre>
 *     request('https://www.random.org/integers/?num=1&min=1&max=100&col=1&base=10&format=plain&rnd=new')
 *     .then((html) => console.log(html))
 *     .catch((err) => console.error(err));
 * </pre>
 *
 * JavaScript version stolen from from https://www.tomas-dvorak.cz/posts/nodejs-request-without-dependencies/.
 *
 * @param url The URL to request data from
 * @returns {Promise<string>}
 */
 export const request = function (url: string):Promise<string> {
    // return new pending promise
    return new Promise<string>((resolve: (response: string) => void, reject: (err:Error) => void) => {
        // select http or https module, depending on reqested url
        const lib = url.startsWith('https') ? require('https') : require('http');
        const request = lib.get(url, (response) => {
            // handle http errors
            if (response.statusCode < 200 || response.statusCode > 299) {
                reject(new Error('Failed to load page, status code: ' + response.statusCode));
            }
            // temporary data holder
            const body = [];
            // on every content chunk, push it to the data array
            response.on('data', (chunk) => body.push(chunk));
            // we are done, resolve promise with those joined chunks
            response.on('end', () => resolve(body.join('')));
        });
        // handle connection errors of the request
        request.on('error', (err) => reject(err));
    })
};
