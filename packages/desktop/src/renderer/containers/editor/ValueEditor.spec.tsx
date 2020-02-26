// jsdom-global is used to define the global "windows" which is unfortunately references when
// importing "rect-ace" from ScriptDialog.tsx
import 'jsdom-global/register'
import { expect, should } from 'chai';
import { hasValueEditorFactory } from './ValueEditor';

should();

describe('ValueEditor', () => {
    it('has some factories', () => {
        expect(hasValueEditorFactory('bool')).to.be.true;
        expect(hasValueEditorFactory('int')).to.be.true;
        expect(hasValueEditorFactory('float')).to.be.true;
        expect(hasValueEditorFactory('str')).to.be.true;
        expect(hasValueEditorFactory('cate.core.types.PointLike')).to.be.true;
        expect(hasValueEditorFactory('cate.core.types.PolygonLike')).to.be.true;
        expect(hasValueEditorFactory('cate.core.types.TimeRangeLike')).to.be.true;
    });

    it('misses some factories', () => {
        expect(hasValueEditorFactory('xarray.core.dataset.Dataset')).to.be.false;
    });

});



