import {assignConditionally} from './assign';
import {should, expect} from 'chai';

should();

describe('assignConditionally()', function () {

    it('works with empty target', function () {
        assignConditionally({}, {})
            .should.deep.equal({});
        assignConditionally({}, {a: 2, b: 'Hi'})
            .should.deep.equal({a: 2, b: 'Hi'});
        assignConditionally({}, {a: 2, b: 'Hi'}, {c: true})
            .should.deep.equal({a: 2, b: 'Hi', c: true});
    });

    it('works with empty sources', function () {
        assignConditionally({a: 2, b: 'Hi'}, {})
            .should.deep.equal({a: 2, b: 'Hi'});
        assignConditionally({a: 2, b: 'Hi'}, {}, {}, {})
            .should.deep.equal({a: 2, b: 'Hi'});
    });

    it('lets first source property win', function () {
        assignConditionally({}, {a: 1}, {a: 2}, {a: 3})
            .should.deep.equal({a: 1});
    });

    it('returns target', function () {
        const target = {a: 1};
        const result = assignConditionally(target, {b: 2});
        expect(result === target).to.be.true;
    });
});
