import * as React from 'react';
import * as assert from 'assert';
import * as fs from 'fs';

import {Config} from './Config';


describe('Config', function () {

    it('can get and set values', function () {
        let config = new Config({a: true});
        assert.equal(config.get('a'), true);
        config.set('a', false);
        assert.equal(config.get('a'), false);

        assert.ok(typeof(config.get('b')) === 'undefined');
        assert.equal(config.get('b', 4), 4);
        config.set('b', 5);
        assert.equal(config.get('b'), 5);
    });

    it('can store and load data to/from JSON', function () {
        var file = '__config__.json';

        let config1 = new Config({
            lastDir: '/user/norman',
            openFiles: ['data/im.png', 'data\\inf.txt'],
            numScreens: 2,
        });

        config1.store(file);
        let config2 = new Config();
        config2.load(file);

        assert.deepEqual(config1.data, config2.data);

        fs.unlink(file, (err) => {});
    });

    it('can load data from JS', function () {
        var file = '__config__.js';

        fs.writeFileSync(file, 'module.exports = {a: 1, b: 2 + 5}');

        let config = new Config();
        config.load(file);

        assert.deepEqual(config.data, {a: 1, b: 2 + 5});

        fs.unlink(file, (err) => {});
    });
});
