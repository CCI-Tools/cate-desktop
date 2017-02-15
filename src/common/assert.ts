
export function ok(condition: any, message?: string) {
    if (!condition) {
        throw new Error('assertion failed' + (message ? `: ${message}` : ''));
    }
}
