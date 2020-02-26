import { expect } from 'chai';
import { memoize } from './memoize';

describe('memoize', function () {

    function f0() {
        return {};
    }

    function f1(a) {
        return {x: 2 * a};
    }

    function f2(a, b) {
        return {x: 2 * a, y: 3 * b};
    }

    const inf = 1000;

    describe('0-arg function', function () {
        it('memoizes inf. calls', function () {
            const mf = memoize(f0);
            const value = mf();
            expect(value).to.deep.equal({});
            for (let i = 0; i < inf; i++) {
                expect(mf()).to.equal(value);
            }
            expect(mf.getSize()).to.equal(1);
        });
    });

    describe('1-arg function', function () {
        it('memoizes max. 3 calls', function () {
            const mf = memoize(f1, 3);
            let value1, value2, value3, value4;
            value1 = mf(456);
            value2 = mf(457);
            value3 = mf(458);
            value4 = mf(459);
            expect(value1).to.deep.equal({x: 2 * 456});
            expect(mf(456)).to.equal(value1);
            expect(mf(457)).to.equal(value2);
            expect(mf(458)).to.equal(value3);
            expect(mf(459)).to.not.equal(value4);
            expect(mf(459)).to.deep.equal(value4);
            expect(mf.getSize()).to.equal(3);
            mf.clearCache();
            expect(mf.getSize()).to.equal(0);
            value1 = mf(456);
            value2 = mf(457);
            value3 = mf(458);
            value4 = mf(459);
            expect(value1).to.deep.equal({x: 2 * 456});
            expect(mf(456)).to.equal(value1);
            expect(mf(457)).to.equal(value2);
            expect(mf(458)).to.equal(value3);
            expect(mf(459)).to.not.equal(value4);
            expect(mf(459)).to.deep.equal(value4);
            expect(mf.getSize()).to.equal(3);
        });
        it('memoizes inf. calls', function () {
            const mf = memoize(f1);
            const values = {};
            for (let i = 0; i < inf; i++) {
                const value = mf(100 + i);
                expect(value).to.deep.equal({x: 2 * (100 + i)});
                values[i] = value;
            }
            expect(mf.getSize()).to.equal(inf);
            for (let i = 0; i < inf; i++) {
                const value = values[i];
                expect(mf(100 + i)).to.equal(value);
            }
        });
    });

    describe('2-arg function', function () {
        it('memoizes max. 3 calls', function () {
            const mf = memoize(f2, 3);
            let value1, value2, value3, value4;
            value1 = mf(456, 563);
            value2 = mf(457, 563);
            value3 = mf(459, 563);
            value4 = mf(459, 564);
            expect(value1).to.deep.equal({x: 2 * 456, y: 3 * 563});
            expect(mf(456, 563)).to.equal(value1);
            expect(mf(457, 563)).to.equal(value2);
            expect(mf(459, 563)).to.equal(value3);
            expect(mf(459, 564)).to.not.equal(value4);
            expect(mf(459, 564)).to.deep.equal(value4);
            expect(mf.getSize()).to.equal(3);
            mf.clearCache();
            expect(mf.getSize()).to.equal(0);
            value1 = mf(456, 563);
            value2 = mf(457, 563);
            value3 = mf(459, 563);
            value4 = mf(459, 564);
            expect(mf(456, 563)).to.equal(value1);
            expect(mf(457, 563)).to.equal(value2);
            expect(mf(459, 563)).to.equal(value3);
            expect(mf(459, 564)).to.not.equal(value4);
            expect(mf(459, 564)).to.deep.equal(value4);
            expect(mf.getSize()).to.equal(3);
        });
        it('memoizes inf. calls', function () {
            const mf = memoize(f2);
            const values = {};
            for (let i = 0; i < inf; i++) {
                const value = mf(100 + i, 200 + i);
                expect(value).to.deep.equal({x: 2 * (100 + i), y: 3 * (200 + i)});
                values[i] = value;
            }
            expect(mf.getSize()).to.equal(inf);
            for (let i = 0; i < inf; i++) {
                const value = values[i];
                expect(mf(100 + i, 200 + i)).to.equal(value);
            }
        });
    });
});
