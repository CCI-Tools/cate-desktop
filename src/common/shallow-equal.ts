
export function shallowEqual(v1: any, v2: any): boolean {
    if (v1 === v2) {
        return true;
    }
    if (v1 && v2) {
        const t1: string = typeof v1;
        const t2: string = typeof v2;
        if (t1 !== t2) {
            return false;
        }
        if (t1 === 'Array') {
            if (!v1.length !== !v2.length) {
                return false;
            }
            if (!v1.length && !v2.length) {
                return true;
            }
            for (let i = 0; i < v1.length; i++) {
                if (v1[i] !== v2[i]) {
                    return false;
                }
            }
            return true;
        } else if (t1 === 'object') {
            const names1 = Object.getOwnPropertyNames(v1);
            const names2 = Object.getOwnPropertyNames(v2);
            if (!names1.length !== !names2.length) {
                return false;
            }
            if (!names1.length && !names2.length) {
                return true;
            }
            for (let propertyName of names1) {
                if (v1[propertyName] !== v2[propertyName]) {
                    return false;
                }
            }
            for (let propertyName of names2) {
                if (v1[propertyName] !== v2[propertyName]) {
                    return false;
                }
            }
            return true;
        }
    }
    return false;
}
