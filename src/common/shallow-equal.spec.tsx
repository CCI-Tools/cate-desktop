import {should, expect} from 'chai';
import {shallowEqual} from "./shallow-equal";

should();

describe('shallow-equal', () => {

    it('can compare objects', () => {
        expect(shallowEqual(
            {},
            {}
        )).to.be.true;

        const a = [1, 2, 3];
        const b = 'pin1';
        const c = {x: 5};
        const d = 4;
        expect(shallowEqual(
            {a, b, c},
            {a, b, c},
        )).to.be.true;
        expect(shallowEqual(
            {a, b, c},
            {a, b, d},
        )).to.be.false;
        expect(shallowEqual(
            {a, b},
            {a, b, c},
        )).to.be.false;
        expect(shallowEqual(
            {a, b, c, d: {x: 6}},
            {a, b, c, d: {x: 6}},
        )).to.be.false;
    });

    it('can compare arrays', () => {
        expect(shallowEqual(
            [],
            []
        )).to.be.true;

        const a = [1, 2, 3];
        const b = 'pin1';
        const c = {x: 5};
        const d = 4;
        expect(shallowEqual(
            [a, b, c],
            [a, b, c],
        )).to.be.true;
        expect(shallowEqual(
            [a, b, c],
            [a, b, d],
        )).to.be.false;
        expect(shallowEqual(
            [a, b],
            [a, b, c],
        )).to.be.false;
        expect(shallowEqual(
            [a, b, c, {x: 6}],
            [a, b, c, {x: 6}],
        )).to.be.false;
    });

    it('can compare other stuff', () => {
        expect(shallowEqual(4.3, 4.3)).to.be.true;
        expect(shallowEqual('x', 'x')).to.be.true;
        expect(shallowEqual(true, true)).to.be.true;
        expect(shallowEqual(shallowEqual, shallowEqual)).to.be.true;

        expect(shallowEqual(4.3, 3.4)).to.be.false;
        expect(shallowEqual('x', 'y')).to.be.false;
        expect(shallowEqual(true, false)).to.be.false;
        expect(shallowEqual(shallowEqual, should)).to.be.false;

        expect(shallowEqual(4.3, 'y')).to.be.false;
        expect(shallowEqual('x', false)).to.be.false;
        expect(shallowEqual(true, 4)).to.be.false;
        expect(shallowEqual(shallowEqual, 'y')).to.be.false;
    });
});



