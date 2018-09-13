import {expect} from "chai";
import {
    ARBITRARY_TYPE,
    DATA_ARRAY_TYPE, DATA_FRAME_LIKE_TYPE, DATA_FRAME_TYPE, DATASET_LIKE_TYPE, DATASET_TYPE, GEO_DATA_FRAME_PROXY_TYPE,
    GEO_DATA_FRAME_TYPE, GEOMETRY_COLLECTION_TYPE, GEOMETRY_LIKE_TYPE, GEOMETRY_TYPE,
    isAssignableFrom, LINE_STRING_TYPE, LITERAL_TYPE, MULTI_LINE_STRING_TYPE, MULTI_POINT_TYPE, MULTI_POLYGON_TYPE,
    ND_ARRAY_TYPE, POINT_LIKE_TYPE, POINT_TYPE, POLYGON_LIKE_TYPE, POLYGON_TYPE
} from "./cate-types";

describe('isAssignableFrom()', function () {

    it('works with null', function () {
        // Yes
        expect(isAssignableFrom(null, null)).to.be.false;
        expect(isAssignableFrom('int', null)).to.be.false;
        expect(isAssignableFrom(null, 'int')).to.be.false;
    });

    it('works with bool', function () {
        // Yes
        expect(isAssignableFrom('bool', 'bool')).to.be.true;
        expect(isAssignableFrom('bool', 'int')).to.be.true;
        expect(isAssignableFrom('bool', 'float')).to.be.true;
        // No
        expect(isAssignableFrom('bool', 'str')).to.be.false;
        expect(isAssignableFrom('bool', DATA_FRAME_TYPE)).to.be.false;
        expect(isAssignableFrom('bool', ND_ARRAY_TYPE)).to.be.false;
    });

    it('works with int', function () {
        // Yes
        expect(isAssignableFrom('int', 'bool')).to.be.true;
        expect(isAssignableFrom('int', 'int')).to.be.true;
        // No
        expect(isAssignableFrom('int', 'float')).to.be.false;
        expect(isAssignableFrom('float', 'str')).to.be.false;
        expect(isAssignableFrom('int', DATA_FRAME_TYPE)).to.be.false;
    });

    it('works with float', function () {
        // Yes
        expect(isAssignableFrom('float', 'bool')).to.be.true;
        expect(isAssignableFrom('float', 'int')).to.be.true;
        expect(isAssignableFrom('float', 'float')).to.be.true;
        // No
        expect(isAssignableFrom('float', 'str')).to.be.false;
        expect(isAssignableFrom('float', DATA_FRAME_TYPE)).to.be.false;
    });

    it('works with str', function () {
        // Yes
        expect(isAssignableFrom('str', 'str')).to.be.true;
        // No
        expect(isAssignableFrom('str', 'bool')).to.be.false;
        expect(isAssignableFrom('str', 'int')).to.be.false;
        expect(isAssignableFrom('str', 'float')).to.be.false;
        expect(isAssignableFrom('str', DATA_FRAME_TYPE)).to.be.false;
    });

    it('works with ' + DATASET_TYPE, function () {
        // Yes
        expect(isAssignableFrom(DATASET_TYPE, DATASET_TYPE)).to.be.true;
        expect(isAssignableFrom(DATASET_TYPE, DATASET_LIKE_TYPE)).to.be.true;
        // No
        expect(isAssignableFrom(DATASET_TYPE, 'bool')).to.be.false;
        expect(isAssignableFrom(DATASET_TYPE, 'int')).to.be.false;
        expect(isAssignableFrom(DATASET_TYPE, 'float')).to.be.false;
        expect(isAssignableFrom(DATASET_TYPE, 'str')).to.be.false;
        expect(isAssignableFrom(DATASET_TYPE, DATA_FRAME_TYPE)).to.be.false;
        expect(isAssignableFrom(DATASET_TYPE, DATA_FRAME_LIKE_TYPE)).to.be.false;
        expect(isAssignableFrom(DATASET_TYPE, GEO_DATA_FRAME_TYPE)).to.be.false;
        expect(isAssignableFrom(DATASET_TYPE, GEO_DATA_FRAME_PROXY_TYPE)).to.be.false;
    });

    it('works with ' + DATASET_LIKE_TYPE, function () {
        // Yes
        expect(isAssignableFrom(DATASET_LIKE_TYPE, DATASET_LIKE_TYPE)).to.be.true;
        expect(isAssignableFrom(DATASET_LIKE_TYPE, DATASET_TYPE)).to.be.true;
        expect(isAssignableFrom(DATASET_LIKE_TYPE, DATA_FRAME_TYPE)).to.be.true;
        // No
        expect(isAssignableFrom(DATASET_LIKE_TYPE, 'bool')).to.be.false;
        expect(isAssignableFrom(DATASET_LIKE_TYPE, 'int')).to.be.false;
        expect(isAssignableFrom(DATASET_LIKE_TYPE, 'float')).to.be.false;
        expect(isAssignableFrom(DATASET_LIKE_TYPE, 'str')).to.be.false;
        expect(isAssignableFrom(DATASET_LIKE_TYPE, DATA_FRAME_LIKE_TYPE)).to.be.false;
        expect(isAssignableFrom(DATASET_LIKE_TYPE, GEO_DATA_FRAME_TYPE)).to.be.false;
        expect(isAssignableFrom(DATASET_LIKE_TYPE, GEO_DATA_FRAME_PROXY_TYPE)).to.be.false;
    });

    it('works with ' + DATA_FRAME_TYPE, function () {
        // Yes
        expect(isAssignableFrom(DATA_FRAME_TYPE, DATA_FRAME_TYPE)).to.be.true;
        expect(isAssignableFrom(DATA_FRAME_TYPE, GEO_DATA_FRAME_TYPE)).to.be.true;
        expect(isAssignableFrom(DATA_FRAME_TYPE, DATA_FRAME_LIKE_TYPE)).to.be.true;
        expect(isAssignableFrom(DATA_FRAME_TYPE, GEO_DATA_FRAME_PROXY_TYPE)).to.be.true;
        // No
        expect(isAssignableFrom(DATA_FRAME_TYPE, 'bool')).to.be.false;
        expect(isAssignableFrom(DATA_FRAME_TYPE, 'int')).to.be.false;
        expect(isAssignableFrom(DATA_FRAME_TYPE, 'float')).to.be.false;
        expect(isAssignableFrom(DATA_FRAME_TYPE, 'str')).to.be.false;
    });

    it('works with ' + DATA_FRAME_LIKE_TYPE, function () {
        // Yes
        expect(isAssignableFrom(DATA_FRAME_LIKE_TYPE, DATA_FRAME_LIKE_TYPE)).to.be.true;
        expect(isAssignableFrom(DATA_FRAME_LIKE_TYPE, DATA_FRAME_TYPE)).to.be.true;
        expect(isAssignableFrom(DATA_FRAME_LIKE_TYPE, GEO_DATA_FRAME_TYPE)).to.be.true;
        expect(isAssignableFrom(DATA_FRAME_LIKE_TYPE, GEO_DATA_FRAME_PROXY_TYPE)).to.be.true;
        expect(isAssignableFrom(DATA_FRAME_LIKE_TYPE, DATASET_TYPE)).to.be.true;
        expect(isAssignableFrom(DATA_FRAME_LIKE_TYPE, DATASET_LIKE_TYPE)).to.be.true;
        // No
        expect(isAssignableFrom(DATA_FRAME_LIKE_TYPE, 'bool')).to.be.false;
        expect(isAssignableFrom(DATA_FRAME_LIKE_TYPE, 'int')).to.be.false;
        expect(isAssignableFrom(DATA_FRAME_LIKE_TYPE, 'float')).to.be.false;
        expect(isAssignableFrom(DATA_FRAME_LIKE_TYPE, 'str')).to.be.false;
    });

    it('works with ' + GEO_DATA_FRAME_TYPE, function () {
        // Yes
        expect(isAssignableFrom(GEO_DATA_FRAME_TYPE, GEO_DATA_FRAME_TYPE)).to.be.true;
        expect(isAssignableFrom(GEO_DATA_FRAME_TYPE, GEO_DATA_FRAME_PROXY_TYPE)).to.be.true;
        // No
        expect(isAssignableFrom(GEO_DATA_FRAME_TYPE, 'bool')).to.be.false;
        expect(isAssignableFrom(GEO_DATA_FRAME_TYPE, 'int')).to.be.false;
        expect(isAssignableFrom(GEO_DATA_FRAME_TYPE, 'float')).to.be.false;
        expect(isAssignableFrom(GEO_DATA_FRAME_TYPE, 'str')).to.be.false;
        expect(isAssignableFrom(GEO_DATA_FRAME_TYPE, DATA_FRAME_TYPE)).to.be.false;
        expect(isAssignableFrom(GEO_DATA_FRAME_TYPE, DATASET_LIKE_TYPE)).to.be.false;
        expect(isAssignableFrom(GEO_DATA_FRAME_TYPE, DATA_FRAME_LIKE_TYPE)).to.be.false;
    });

    it('works with ' + ND_ARRAY_TYPE, function () {
        // Yes
        expect(isAssignableFrom(ND_ARRAY_TYPE, ND_ARRAY_TYPE)).to.be.true;
        expect(isAssignableFrom(ND_ARRAY_TYPE, DATA_ARRAY_TYPE)).to.be.true;
        // No
        expect(isAssignableFrom(ND_ARRAY_TYPE, 'bool')).to.be.false;
        expect(isAssignableFrom(ND_ARRAY_TYPE, 'int')).to.be.false;
        expect(isAssignableFrom(ND_ARRAY_TYPE, 'float')).to.be.false;
        expect(isAssignableFrom(ND_ARRAY_TYPE, 'str')).to.be.false;
    });

    it('works with ' + ARBITRARY_TYPE, function () {
        // Yes
        expect(isAssignableFrom(ARBITRARY_TYPE, ND_ARRAY_TYPE)).to.be.true;
        expect(isAssignableFrom(ARBITRARY_TYPE, DATA_ARRAY_TYPE)).to.be.true;
        expect(isAssignableFrom(ARBITRARY_TYPE, DATASET_TYPE)).to.be.true;
        expect(isAssignableFrom(ARBITRARY_TYPE, 'bool')).to.be.true;
        expect(isAssignableFrom(ARBITRARY_TYPE, 'int')).to.be.true;
        expect(isAssignableFrom(ARBITRARY_TYPE, 'float')).to.be.true;
        expect(isAssignableFrom(ARBITRARY_TYPE, 'str')).to.be.true;
    });

    it('works with ' + LITERAL_TYPE, function () {
        // Yes
        expect(isAssignableFrom(LITERAL_TYPE, 'str')).to.be.true;
        expect(isAssignableFrom(LITERAL_TYPE, LITERAL_TYPE)).to.be.true;
        // No
        expect(isAssignableFrom(LITERAL_TYPE, ND_ARRAY_TYPE)).to.be.false;
        expect(isAssignableFrom(LITERAL_TYPE, DATA_ARRAY_TYPE)).to.be.false;
        expect(isAssignableFrom(LITERAL_TYPE, DATASET_TYPE)).to.be.false;
        expect(isAssignableFrom(LITERAL_TYPE, 'bool')).to.be.false;
        expect(isAssignableFrom(LITERAL_TYPE, 'int')).to.be.false;
        expect(isAssignableFrom(LITERAL_TYPE, 'float')).to.be.false;
    });

    it('works with ' + POINT_LIKE_TYPE, function () {
        // Yes
        expect(isAssignableFrom(POINT_LIKE_TYPE, 'str')).to.be.true;
        expect(isAssignableFrom(POINT_LIKE_TYPE, POINT_LIKE_TYPE)).to.be.true;
        expect(isAssignableFrom(POINT_LIKE_TYPE, POINT_TYPE)).to.be.true;
        // No
        expect(isAssignableFrom(POINT_LIKE_TYPE, GEOMETRY_LIKE_TYPE)).to.be.false;
        expect(isAssignableFrom(POINT_LIKE_TYPE, POLYGON_TYPE)).to.be.false;
        expect(isAssignableFrom(POINT_LIKE_TYPE, 'bool')).to.be.false;
        expect(isAssignableFrom(POINT_LIKE_TYPE, 'int')).to.be.false;
        expect(isAssignableFrom(POINT_LIKE_TYPE, 'float')).to.be.false;
    });

    it('works with ' + POLYGON_LIKE_TYPE, function () {
        // Yes
        expect(isAssignableFrom(POLYGON_LIKE_TYPE, 'str')).to.be.true;
        expect(isAssignableFrom(POLYGON_LIKE_TYPE, POLYGON_LIKE_TYPE)).to.be.true;
        expect(isAssignableFrom(POLYGON_LIKE_TYPE, POLYGON_TYPE)).to.be.true;
        // No
        expect(isAssignableFrom(POLYGON_LIKE_TYPE, GEOMETRY_LIKE_TYPE)).to.be.false;
        expect(isAssignableFrom(POLYGON_LIKE_TYPE, POINT_TYPE)).to.be.false;
        expect(isAssignableFrom(POLYGON_LIKE_TYPE, 'bool')).to.be.false;
        expect(isAssignableFrom(POLYGON_LIKE_TYPE, 'int')).to.be.false;
        expect(isAssignableFrom(POLYGON_LIKE_TYPE, 'float')).to.be.false;
    });

    it('works with ' + GEOMETRY_LIKE_TYPE, function () {
        // Yes
        expect(isAssignableFrom(GEOMETRY_LIKE_TYPE, 'str')).to.be.true;
        expect(isAssignableFrom(GEOMETRY_LIKE_TYPE, GEOMETRY_LIKE_TYPE)).to.be.true;
        expect(isAssignableFrom(GEOMETRY_LIKE_TYPE, GEOMETRY_TYPE)).to.be.true;
        expect(isAssignableFrom(GEOMETRY_LIKE_TYPE, POINT_TYPE)).to.be.true;
        expect(isAssignableFrom(GEOMETRY_LIKE_TYPE, MULTI_POINT_TYPE)).to.be.true;
        expect(isAssignableFrom(GEOMETRY_LIKE_TYPE, POLYGON_TYPE)).to.be.true;
        expect(isAssignableFrom(GEOMETRY_LIKE_TYPE, MULTI_POLYGON_TYPE)).to.be.true;
        expect(isAssignableFrom(GEOMETRY_LIKE_TYPE, LINE_STRING_TYPE)).to.be.true;
        expect(isAssignableFrom(GEOMETRY_LIKE_TYPE, MULTI_LINE_STRING_TYPE)).to.be.true;
        expect(isAssignableFrom(GEOMETRY_LIKE_TYPE, GEOMETRY_COLLECTION_TYPE)).to.be.true;
        // No
        expect(isAssignableFrom(GEOMETRY_LIKE_TYPE, 'bool')).to.be.false;
        expect(isAssignableFrom(GEOMETRY_LIKE_TYPE, 'int')).to.be.false;
        expect(isAssignableFrom(GEOMETRY_LIKE_TYPE, 'float')).to.be.false;
    });
});
