import * as path from 'path';
import * as fs from 'fs';

export class Configuration {
    private _data: Object = {};

    constructor(data?: Object) {
        if (data) {
            this._data = data;
        }
    }

    get data(): Object {
        return this._data;
    }

    get(name: string, defaultValue?: any): any {
        if (this._data.hasOwnProperty(name)) {
            return this._data[name];
        }
        return defaultValue;
    }

    set(name: string, value: any): Configuration {
        this._data[name] = value;
        return this;
    }

    load(file: string, callback?: ((err: any) => any)): Configuration {
        let error;
        if (!fs.existsSync(file)) {
            error = new Error('file not found');
        }
        if (!error) {
            try {
                this._data = require(path.resolve(file));
            } catch (e) {
                error = e;
            }
        }
        if (callback) {
            callback(error);
        }
        return this;
    }

    store(file: string, callback?: (err: any) => any): Configuration {
        let jsonText = JSON.stringify(this._data, null, 2);
        let error;
        try {
            fs.writeFileSync(path.resolve(file), jsonText, 'utf8');
        } catch (e) {
            error = e;
        }
        if (callback) {
            callback(error);
        }
        return this;
    }
}
