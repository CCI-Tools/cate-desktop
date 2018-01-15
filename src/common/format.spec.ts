import {should, expect} from "chai";
import {formatDataTypeName} from "./format";

should();

describe('formatDataTypeName()', function () {

    it('works', function () {
        formatDataTypeName('xarray.core.dataset.Dataset', false).should.equal('Dataset');
        formatDataTypeName('xarray.core.dataset.Dataset', true).should.equal('xarray.core.dataset.Dataset');
        formatDataTypeName('int', true).should.equal('int');
        formatDataTypeName('int', false).should.equal('int');
        formatDataTypeName('int:4', true).should.equal('int:4');
        formatDataTypeName('int:4', false).should.equal('int:4');
        formatDataTypeName('float:19.9', true).should.equal('float:19.9');
        formatDataTypeName('float:19.9', false).should.equal('float:19.9');
        expect(formatDataTypeName(null, true)).to.be.null;
        expect(formatDataTypeName(null, false)).to.be.null;
    });
});

