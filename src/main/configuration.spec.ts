import {expect} from 'chai';
import * as fs from 'fs';

import {Configuration} from './configuration';


describe('Configuration', function () {

    it('can get and set values', function () {
        let config = new Configuration({a: true});
        expect(config.get('a')).to.be.true;
        config.set('a', false);
        expect(config.get('a')).to.be.false;

        expect(config.get('b')).to.be.undefined;
        expect(config.get('b', 4)).to.equal(4);
        config.set('b', 5);
        expect(config.get('b')).to.equal(5);
    });

    it('can store and load data to/from JSON', function () {
        let file = '__config__.json';

        let config1 = new Configuration({
            lastDir: '/user/norman',
            openFiles: ['data/im.png', 'data\\inf.txt'],
            numScreens: 2,
        });

        config1.store(file);
        let config2 = new Configuration();
        config2.load(file);

        expect(config1.data).to.deep.equal(config2.data);

        fs.unlink(file, () => {});
    });

    it('can load data from JS', function () {
        let file = '__config__.js';

        fs.writeFileSync(file, 'module.exports = {a: 1, b: 2 + 5}');

        let config = new Configuration();
        config.load(file);

        expect(config.data).to.deep.equal({a: 1, b: 2 + 5});

        fs.unlink(file, () => {});
    });
});
