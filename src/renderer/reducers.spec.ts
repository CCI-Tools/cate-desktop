import {updateObject, updateProperty} from "./reducers";
import {should} from "chai";

should();

describe('updateObject()', function () {

    it('works', function () {
        updateObject({}, {})
            .should.deep.equal({});
        updateObject({}, {a: 2, b: 'Hi'})
            .should.deep.equal({a: 2, b: 'Hi'});
    });
});


describe('updateProperty()', function () {

    it('works', function () {
        updateProperty({}, 'a', {x: 1, y:2})
            .should.deep.equal({a: {x: 1, y:2}});
        updateProperty({a: {y: 3, z: 4}}, 'a', {x: 1, y:2})
            .should.deep.equal({a: {x: 1, y:2, z: 4}});
    });
});
