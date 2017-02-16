import {updateObject, updatePropertyObject, updateConditionally} from "./objutil";
import {should, expect} from "chai";

should();

describe('updateObject()', function () {

    it('works', function () {
        updateObject({}, {})
            .should.deep.equal({});
        updateObject({}, {a: 2, b: 'Hi'})
            .should.deep.equal({a: 2, b: 'Hi'});
        let b;
        updateObject({}, {a: 2, b: 'Hi'}, {b})
            .should.deep.equal({a: 2, b});
        updateObject({}, {a: 2, b}, {b: 'Hi'})
            .should.deep.equal({a: 2, b: 'Hi'});
    });
});


describe('updatePropertyObject()', function () {

    it('works', function () {
        updatePropertyObject({}, 'a', {x: 1, y:2})
            .should.deep.equal({a: {x: 1, y:2}});
        updatePropertyObject({a: {y: 3, z: 4}}, 'a', {x: 1, y:2})
            .should.deep.equal({a: {x: 1, y:2, z: 4}});
    });
});

describe('updateConditionally()', function () {

    it('works with empty target', function () {
        updateConditionally({}, {})
            .should.deep.equal({});
        updateConditionally({}, {a: 2, b: 'Hi'})
            .should.deep.equal({a: 2, b: 'Hi'});
        updateConditionally({}, {a: 2, b: 'Hi'}, {c: true})
            .should.deep.equal({a: 2, b: 'Hi', c: true});
    });

    it('works with empty sources', function () {
        updateConditionally({a: 2, b: 'Hi'}, {})
            .should.deep.equal({a: 2, b: 'Hi'});
        updateConditionally({a: 2, b: 'Hi'}, {}, {}, {})
            .should.deep.equal({a: 2, b: 'Hi'});
    });

    it('lets first source property win', function () {
        updateConditionally({}, {a: 1}, {a: 2}, {a: 3})
            .should.deep.equal({a: 1});
    });

    it('returns copy', function () {
        const target = {a: 1};
        const result = updateConditionally(target);
        expect(result === target).to.be.false;
    });
});

