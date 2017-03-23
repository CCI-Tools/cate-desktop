import {updateObject, updatePropertyObject, updateConditionally} from "./objutil";
import {should, expect} from "chai";
import {formatDataTypeName} from "./format";

should();

describe('formatDataTypeName()', function () {

    it('works', function () {
        formatDataTypeName('xarray.core.dataset.Dataset', false).should.equal('Dataset');
        formatDataTypeName('xarray.core.dataset.Dataset', true).should.equal('xarray.core.dataset.Dataset');
        formatDataTypeName('int', true).should.equal('int');
        formatDataTypeName('int', false).should.equal('int');
        expect(formatDataTypeName(null, true)).to.be.null;
        expect(formatDataTypeName(null, false)).to.be.null;
    });
});

