/**
 * Created by Norman on 22.03.2017.
 */


export function isDefined(value: any): boolean {
    return typeof(value) !== 'undefined';
}

export function isUndefined(value: any): boolean {
    return typeof(value) === 'undefined';
}

export function isDefinedAndNotNull(value: any): boolean {
    return value !== null && typeof(value) !== 'undefined';
}

export function isUndefinedOrNull(value: any): boolean {
    return value === null || typeof(value) === 'undefined';
}

export function isNumber(value: any): boolean {
    return typeof(value) === 'number';
}

export function isString(value: any): boolean {
    return typeof(value) === 'string';
}
