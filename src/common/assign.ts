/**
 * Works similar to ES6 Object.assign() but will only assign a property if
 * a given *source* property is undefined in *target*.
 *
 * @param target The target object
 * @param sources The source objects
 * @returns {Object}
 * @author Norman Fomferra
 */
export function assignConditionally(target: Object, ...sources: Object[]) {
    for (let source of sources) {
        for (let name of Object.keys(source)) {
            if (typeof target[name] === 'undefined') {
                target[name] = source[name];
            }
        }
    }
    return target;
}
