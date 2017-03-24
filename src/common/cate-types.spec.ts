import {expect} from "chai";
import {DATA_ARRAY_TYPE, DATA_FRAME_TYPE, GEO_DATA_FRAME_TYPE, isAssignableFrom, ND_ARRAY_TYPE} from "./cate-types";

describe('isAssignableFrom()', function () {

    it('works with null', function () {
        expect(isAssignableFrom(null, null)).to.be.false;
        expect(isAssignableFrom('int', null)).to.be.false;
        expect(isAssignableFrom(null, 'int')).to.be.false;
    });

    it('works with bool', function () {
        expect(isAssignableFrom('bool', 'bool')).to.be.true;
        expect(isAssignableFrom('bool', 'int')).to.be.true;
        expect(isAssignableFrom('bool', 'float')).to.be.true;
        expect(isAssignableFrom('bool', 'str')).to.be.true;
        expect(isAssignableFrom('bool', ND_ARRAY_TYPE)).to.be.false;
        expect(isAssignableFrom('bool', DATA_FRAME_TYPE)).to.be.true;
    });

    it('works with int', function () {
        expect(isAssignableFrom('int', 'bool')).to.be.true;
        expect(isAssignableFrom('int', 'int')).to.be.true;
        expect(isAssignableFrom('int', 'float')).to.be.false;
        expect(isAssignableFrom('float', 'str')).to.be.false;
        expect(isAssignableFrom('int', DATA_FRAME_TYPE)).to.be.false;
    });

    it('works with float', function () {
        expect(isAssignableFrom('float', 'bool')).to.be.true;
        expect(isAssignableFrom('float', 'int')).to.be.true;
        expect(isAssignableFrom('float', 'float')).to.be.true;
        expect(isAssignableFrom('float', 'str')).to.be.false;
        expect(isAssignableFrom('float', DATA_FRAME_TYPE)).to.be.false;
    });

    it('works with str', function () {
        expect(isAssignableFrom('str', 'bool')).to.be.false;
        expect(isAssignableFrom('str', 'int')).to.be.false;
        expect(isAssignableFrom('str', 'float')).to.be.false;
        expect(isAssignableFrom('str', 'str')).to.be.true;
        expect(isAssignableFrom('str', DATA_FRAME_TYPE)).to.be.false;
    });

    it('works with ' + DATA_FRAME_TYPE, function () {
        expect(isAssignableFrom(DATA_FRAME_TYPE, 'bool')).to.be.false;
        expect(isAssignableFrom(DATA_FRAME_TYPE, 'int')).to.be.false;
        expect(isAssignableFrom(DATA_FRAME_TYPE, 'float')).to.be.false;
        expect(isAssignableFrom(DATA_FRAME_TYPE, 'str')).to.be.false;
        expect(isAssignableFrom(DATA_FRAME_TYPE, DATA_FRAME_TYPE)).to.be.true;
        expect(isAssignableFrom(DATA_FRAME_TYPE, GEO_DATA_FRAME_TYPE)).to.be.true;
    });

    it('works with ' + GEO_DATA_FRAME_TYPE, function () {
        expect(isAssignableFrom(GEO_DATA_FRAME_TYPE, 'bool')).to.be.false;
        expect(isAssignableFrom(GEO_DATA_FRAME_TYPE, 'int')).to.be.false;
        expect(isAssignableFrom(GEO_DATA_FRAME_TYPE, 'float')).to.be.false;
        expect(isAssignableFrom(GEO_DATA_FRAME_TYPE, 'str')).to.be.false;
        expect(isAssignableFrom(GEO_DATA_FRAME_TYPE, DATA_FRAME_TYPE)).to.be.false;
        expect(isAssignableFrom(GEO_DATA_FRAME_TYPE, GEO_DATA_FRAME_TYPE)).to.be.true;
    });

    it('works with ' + ND_ARRAY_TYPE, function () {
        expect(isAssignableFrom(ND_ARRAY_TYPE, 'bool')).to.be.false;
        expect(isAssignableFrom(ND_ARRAY_TYPE, 'int')).to.be.false;
        expect(isAssignableFrom(ND_ARRAY_TYPE, 'float')).to.be.false;
        expect(isAssignableFrom(ND_ARRAY_TYPE, 'str')).to.be.false;
        expect(isAssignableFrom(ND_ARRAY_TYPE, ND_ARRAY_TYPE)).to.be.true;
        expect(isAssignableFrom(ND_ARRAY_TYPE, DATA_ARRAY_TYPE)).to.be.true;
    });
});
