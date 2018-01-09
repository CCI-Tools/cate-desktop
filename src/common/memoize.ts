import {isNullOrUndefined} from "util";

export interface MemoizedFunction {
    (...args): any;

    getMaxSize();

    getSize();

    clearCache();
}

/**
 * Wrap a function with a memoizing function that saves up to the maxSize most recent calls.
 *
 * @param func The function to wrap.
 * @param maxSize Number of most recent calls to be memoized.
 * @returns A memoized version of func.
 */
export function memoize(func: Function, maxSize?: number): MemoizedFunction {

    let memo = {};
    let size = 0;

    const memoized = (...args) => {
        //console.log('memoized: totalSize =', size)
        const key = args.map(a => `(${a}:${typeof a})`).join();
        if (key in memo) {
            return memo[key];
        } else {
            const value = func(...args);
            if (isNullOrUndefined(maxSize) || maxSize > 0 && size < maxSize) {
                memo[key] = value;
                size++;
            }
            return value;
        }
    };

    memoized['getMaxSize'] = () => maxSize;
    memoized['getSize'] = () => size;
    memoized['clearCache'] = () => {
        memo = {};
        size = 0;
    };

    return memoized as MemoizedFunction;
}
