import { expect } from 'chai';
import { isBox, validateGeometryValue } from './geometry-util';

describe('geometry-util', function () {

    describe('validateGeometryValue()', function () {
        it('can detect WKT syntax errors', function () {
            expect(validateGeometryValue.bind(this, 'PIONT (1 2)', 'Point')).to.throw('Point WKT must start with "POINT".');
            expect(validateGeometryValue.bind(this, 'POINT (1 2))', 'Polygon')).to.throw('Polygon WKT must start with "POLYGON".');
            expect(validateGeometryValue.bind(this, 'POLYGON ', 'Polygon')).to.throw('Invalid WKT, too few "(".');
            expect(validateGeometryValue.bind(this, 'POLYGON (1 2, 3 4, 5 6, 1 2)', 'Polygon')).to.throw('Invalid WKT, too few "(".');
            expect(validateGeometryValue.bind(this, 'POLYGON ((1 2, 3 4, 5 6, 1 2)))', 'Polygon')).to.throw('Invalid WKT, too many ")".');
            expect(validateGeometryValue.bind(this, 'POLYGON ((1 2, 3 4, 5 6, 1 2)', 'Polygon')).to.throw('Invalid WKT, too many "(".');
            expect(validateGeometryValue.bind(this, 'POLYGON (((1 2, 3 4, 5 6, 1 2))', 'Polygon')).to.throw('Invalid WKT, too many "(".');
            expect(validateGeometryValue.bind(this, 'POLYGON (((1 2, 3 4, 5 6, 1 2)))', 'Polygon')).to.throw('Invalid WKT, too many "(".');
            expect(validateGeometryValue.bind(this, 'POLYGON ((1 2, 3 4, 1 2))', 'Polygon')).to.throw('Invalid WKT, too few coordinates.');
            expect(validateGeometryValue.bind(this, 'POLYGON ((1 2, 3 4, 5, 1 2))', 'Polygon')).to.throw('Illegal number of coordinates.');
            expect(validateGeometryValue.bind(this, 'POLYGON ((1 2, A 4, 5 6, 1 2))', 'Polygon')).to.throw('Longitude value must be a number.');
            expect(validateGeometryValue.bind(this, 'POLYGON ((1 2, 3 B, 5 6, 1 2))', 'Polygon')).to.throw('Latitude value must be a number.');
            expect(validateGeometryValue.bind(this, 'POLYGON ((1 2, 180.01 4, 5 6, 1 2))', 'Polygon')).to.throw('Longitude must be in the range -180 to +180 degrees.');
            expect(validateGeometryValue.bind(this, 'POLYGON ((1 2, 3 -90.5, 5 6, 1 2))', 'Polygon')).to.throw('Latitude must be in the range -90 to +90 degrees.');
        });

        it('can detect simple Point syntax errors', function () {
            expect(validateGeometryValue.bind(this, '1.2', 'Point')).to.throw('Illegal number of coordinates.');
            expect(validateGeometryValue.bind(this, '1.2 -3.4 2.1', 'Point')).to.throw('Illegal number of coordinates.');
            expect(validateGeometryValue.bind(this, '1000.2 -3.4', 'Point')).to.throw('Longitude must be in the range -180 to +180 degrees.');
            expect(validateGeometryValue.bind(this, '1.2 -3000.4', 'Point')).to.throw('Latitude must be in the range -90 to +90 degrees.');
        });

        it('can detect simple Polygon syntax errors', function () {
            expect(validateGeometryValue.bind(this, '1.2 -3.4 5.6', 'Polygon')).to.throw('Illegal number of coordinates.');
            expect(validateGeometryValue.bind(this, '1.2 -3.4 5.6 -7.8 9.1', 'Polygon')).to.throw('Illegal number of coordinates.');
            expect(validateGeometryValue.bind(this, '1.2 -3.4 500.6 -7.8', 'Polygon')).to.throw('Longitude must be in the range -180 to +180 degrees.');
            expect(validateGeometryValue.bind(this, '1.2 -3.4 5.6 -700.8', 'Polygon')).to.throw('Latitude must be in the range -90 to +90 degrees.');
        });

        it('can convert simple Point syntax', function () {
            expect(validateGeometryValue('1.2 -3.4', 'Point')).to.be.undefined;
        });

        it('can convert simple Polygon syntax', function () {
            expect(validateGeometryValue('1.2 -3.4 5.6 -7.8', 'Polygon')).to.be.undefined;
        });

        it('can convert WKT syntax', function () {
            expect(validateGeometryValue('POINT (1.2 -3.4)', 'Point')).to.be.undefined;
            expect(validateGeometryValue('POLYGON ((1.2 -3.4, 5.6 -7.8, 9.1 -2.3, 1.2 -3.4))', 'Polygon')).to.be.undefined;
            expect(validateGeometryValue('POINT (1.2 -3.4)', 'Geometry')).to.be.undefined;
            expect(validateGeometryValue('POLYGON ((1.2 -3.4, 5.6 -7.8, 9.1 -2.3, 1.2 -3.4))', 'Geometry')).to.be.undefined;
        });
    });

    it('isBox', function () {
        const point = {type: 'Point', coordinates: [-4, -4]};
        const line = {type: 'LineString', coordinates: [[-4, -4], [4, -4]]};
        const triangle = {type: 'Polygon', coordinates: [[[-4, -4], [4, -4], [4, 4], [-4, -4]]]};
        const caro = {type: 'Polygon', coordinates: [[[-4, 0], [0, -4], [4, 0], [0, 4], [-4, 0]]]};
        const box = {type: 'Polygon', coordinates: [[[-4, -4], [4, -4], [4, 4], [-4, 4], [-4, -4]]]};
        expect(isBox(point)).to.be.false;
        expect(isBox(line)).to.be.false;
        expect(isBox(triangle)).to.be.false;
        expect(isBox(caro)).to.be.false;
        expect(isBox(box)).to.be.true;
    });
});
