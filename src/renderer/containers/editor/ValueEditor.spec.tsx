import {should, expect} from 'chai';
import {hasValueEditorFactory} from "./ValueEditor";

should();

describe('ValueEditor', () => {
    it('has some factories', () => {
        expect(hasValueEditorFactory('bool')).to.be.true;
        expect(hasValueEditorFactory('int')).to.be.true;
        expect(hasValueEditorFactory('float')).to.be.true;
        expect(hasValueEditorFactory('str')).to.be.true;
        expect(hasValueEditorFactory('cate.core.types.PointLike')).to.be.true;
        expect(hasValueEditorFactory('cate.core.types.PolygonLike')).to.be.true;
    });

    it('has misses some factories', () => {
        expect(hasValueEditorFactory('xarray.core.dataset.Dataset')).to.be.false;
    });

});



