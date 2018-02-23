/**
 * Object functions used to improve readability of Redux reducer code.
 *
 * @author Norman Fomferra
 */

import {isDefined, isUndefined} from "./types";

/**
 * Encapsulate the idea of passing a new object as the first parameter
 * to <code>Object.assign</code> to ensure we correctly copy data instead of mutating.
 *
 * @param target The target object
 * @param sources The source objects
 * @returns a new {Object}
 */
export function updateObject(target, ...sources) {
    return Object.assign({}, target, ...sources);
}

/**
 * Similar to <code>updateObject()</code> but updates just the given property in *target*.
 *
 * @param target The target object
 * @param propertyName The property's name.
 * @param newValue The property's new value.
 * @returns a new {Object}
 */
export function updatePropertyObject(target, propertyName: string, newValue) {
    const oldValue = target[propertyName];
    return updateObject(target, {[propertyName]: updateObject(oldValue, newValue)});
}

/**
 * Similar to <code>updateObject()</code> but will only assign a property if
 * a given *source* property is undefined in *target*.
 *
 * @param target The target object
 * @param sources The source objects
 * @returns a new {Object}
 */
export function updateConditionally(target, ...sources) {
    target = {...target};
    for (let source of sources) {
        if (isDefined(source)) {
            for (let name of Object.keys(source)) {
                if (isUndefined(target[name])) {
                    target[name] = source[name];
                }
            }
        }
    }
    return target;
}

// TODO (nf): test & find better name
export function updateConditionally2(target, ...sources) {
    target = {...target};
    for (let source of sources) {
        if (isDefined(source)) {
            for (let name of Object.keys(source)) {
                if (isDefined(source[name])) {
                    target[name] = source[name];
                }
            }
        }
    }
    return target;
}
