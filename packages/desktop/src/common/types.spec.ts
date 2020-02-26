import { should } from 'chai';
import { isDefined, isUndefined } from './types';

should();

let undef;
let emptyObj: any = {};

describe('isUndefined', function () {

    it('returns true', function () {
        isUndefined(undef).should.be.true;
        isUndefined(emptyObj.x).should.be.true;
    });
    it('returns false', function () {
        isUndefined(null).should.be.false;
        isUndefined(0).should.be.false;
        isUndefined(false).should.be.false;
        isUndefined(emptyObj).should.be.false;
    });
});

describe('isDefined', function () {

    it('returns false', function () {
        isDefined(undef).should.be.false;
        isDefined(emptyObj.x).should.be.false;
    });
    it('returns true', function () {
        isDefined(null).should.be.true;
        isDefined(0).should.be.true;
        isDefined(false).should.be.true;
        isDefined(emptyObj).should.be.true;
    });
});
