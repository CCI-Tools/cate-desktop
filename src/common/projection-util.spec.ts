import {expect} from 'chai';
import {validateProjectionCode} from "./projection-util";

describe('ProjectionDialog', function () {

    describe('validateProjectionCode()', function () {
        it('accepts valid proj4 default codes', function () {
            expect(validateProjectionCode('EPSG:4326')).to.be.undefined;
            expect(validateProjectionCode('WGS84')).to.be.undefined;

            expect(validateProjectionCode('EPSG:3857')).to.be.undefined;
            expect(validateProjectionCode('EPSG:900913')).to.be.undefined;
            expect(validateProjectionCode('GOOGLE')).to.be.undefined;
        });

        it('accepts valid Cate projection codes', function () {
            expect(validateProjectionCode('Glaciers_CCI_Greenland')).to.be.undefined;
            expect(validateProjectionCode('EPSG:3411')).to.be.undefined;
            expect(validateProjectionCode('EPSG:3412')).to.be.undefined;
            expect(validateProjectionCode('EPSG:3413')).to.be.undefined;
            expect(validateProjectionCode('EPSG:3395')).to.be.undefined;
            expect(validateProjectionCode('EPSG:3408')).to.be.undefined;
            expect(validateProjectionCode('EPSG:3409')).to.be.undefined;
            expect(validateProjectionCode('EPSG:3410')).to.be.undefined;
        });

        it('can detect invalid projection codes', function () {
            expect(validateProjectionCode.bind(this, 'E')).to.throw('"E" is not a legal projection code.');
            expect(validateProjectionCode.bind(this, 'EPSG 4326')).to.throw('"EPSG 4326" is not a legal projection code.');
            expect(validateProjectionCode.bind(this, 'EPGS:4326')).to.throw('"EPGS:4326" is not a legal projection code.');
        });
    });
});
