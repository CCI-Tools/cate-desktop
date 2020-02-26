import { expect } from 'chai';
import * as Cesium from 'cesium';
import { entityToGeoJson } from './cesium-util';


describe('cesium-util', function () {
    describe('entityToGeoJson', function () {

        it('works for null entities', function () {
            let obj = entityToGeoJson(null, 'x', {});
            expect(obj).to.equal(null);
        });

        it('works for point entities', function () {

            let position = Cesium.Cartographic.toCartesian({
                                                               longitude: Cesium.Math.toRadians(10.24),
                                                               latitude: Cesium.Math.toRadians(53.52),
                                                               height: 0.0
                                                           });

            let obj = entityToGeoJson(new Cesium.Entity({
                                                            position,
                                                            point: {
                                                                show: true,
                                                                outlineColor: Cesium.Color.RED,
                                                                outlineWidth: 1.5,
                                                                color: Cesium.Color.WHITE,
                                                                pixelSize: 10,
                                                            }
                                                        }), 'bibo-643', {visible: true});

            expect(obj).to.exist;
            expect(obj.type).to.equal('Feature');
            expect(obj.id).to.equal('bibo-643');
            expect(obj.geometry).to.exist;
            expect(obj.geometry.type).to.equal('Point');
            expect(obj.geometry.coordinates).to.exist;
            expect(obj.geometry.coordinates.length).to.equal(2);
            expect(obj.geometry.coordinates[0]).to.be.approximately(10.24, 1e-5);
            expect(obj.geometry.coordinates[1]).to.be.approximately(53.52, 1e-5);
            expect(obj.properties).to.deep.equal({visible: true});
        });

        it('works for polyline entities', function () {

            let positions = [
                Cesium.Cartographic.toCartesian({
                                                    longitude: Cesium.Math.toRadians(10.24),
                                                    latitude: Cesium.Math.toRadians(53.52),
                                                    height: 0.0
                                                }),
                Cesium.Cartographic.toCartesian({
                                                    longitude: Cesium.Math.toRadians(10.24 + 10),
                                                    latitude: Cesium.Math.toRadians(53.52),
                                                    height: 0.0
                                                }),
                Cesium.Cartographic.toCartesian({
                                                    longitude: Cesium.Math.toRadians(10.24 + 10),
                                                    latitude: Cesium.Math.toRadians(53.52 - 5),
                                                    height: 0.0
                                                }),
            ];

            let obj = entityToGeoJson(new Cesium.Entity({
                                                            polyline: {
                                                                positions: positions,
                                                                material: Cesium.Color.BLUE,
                                                                width: 3.5,
                                                            }
                                                        }), 'bibo-644', {visible: true});

            expect(obj).to.exist;
            expect(obj.type).to.equal('Feature');
            expect(obj.id).to.equal('bibo-644');
            expect(obj.geometry).to.exist;
            expect(obj.geometry.type).to.equal('LineString');
            expect(obj.geometry.coordinates).to.exist;
            expect(obj.geometry.coordinates.length).to.equal(3);
            expect(obj.geometry.coordinates[0][0]).to.be.approximately(10.24, 1e-5);
            expect(obj.geometry.coordinates[0][1]).to.be.approximately(53.52, 1e-5);
            expect(obj.geometry.coordinates[1][0]).to.be.approximately(10.24 + 10, 1e-5);
            expect(obj.geometry.coordinates[1][1]).to.be.approximately(53.52, 1e-5);
            expect(obj.geometry.coordinates[2][0]).to.be.approximately(10.24 + 10, 1e-5);
            expect(obj.geometry.coordinates[2][1]).to.be.approximately(53.52 - 5, 1e-5);
            expect(obj.properties).to.deep.equal({visible: true});
        });

        it('works for polygon entities', function () {

            let positions = [
                Cesium.Cartographic.toCartesian({
                                                    longitude: Cesium.Math.toRadians(10.24),
                                                    latitude: Cesium.Math.toRadians(53.52),
                                                    height: 0.0
                                                }),
                Cesium.Cartographic.toCartesian({
                                                    longitude: Cesium.Math.toRadians(10.24 + 10),
                                                    latitude: Cesium.Math.toRadians(53.52),
                                                    height: 0.0
                                                }),
                Cesium.Cartographic.toCartesian({
                                                    longitude: Cesium.Math.toRadians(10.24 + 10),
                                                    latitude: Cesium.Math.toRadians(53.52 - 5),
                                                    height: 0.0
                                                }),
            ];

            let obj = entityToGeoJson(new Cesium.Entity({
                                                            polygon: {
                                                                hierarchy: {positions},
                                                                material: Cesium.Color.YELLOW.withAlpha(0.7),
                                                                outlineWidth: 2.8,
                                                                outlineColor: Cesium.Color.BLACK.withAlpha(0.4),
                                                            }
                                                        }), 'bibo-645', {visible: true});

            expect(obj).to.exist;
            expect(obj.type).to.equal('Feature');
            expect(obj.id).to.equal('bibo-645');
            expect(obj.geometry).to.exist;
            expect(obj.geometry.type).to.equal('Polygon');
            expect(obj.geometry.coordinates).to.exist;
            expect(obj.geometry.coordinates.length).to.equal(1);
            expect(obj.geometry.coordinates[0]).exist;
            expect(obj.geometry.coordinates[0].length).to.equal(4);
            expect(obj.geometry.coordinates[0][0][0]).to.be.approximately(10.24, 1e-5);
            expect(obj.geometry.coordinates[0][0][1]).to.be.approximately(53.52, 1e-5);
            expect(obj.geometry.coordinates[0][1][0]).to.be.approximately(10.24 + 10, 1e-5);
            expect(obj.geometry.coordinates[0][1][1]).to.be.approximately(53.52, 1e-5);
            expect(obj.geometry.coordinates[0][2][0]).to.be.approximately(10.24 + 10, 1e-5);
            expect(obj.geometry.coordinates[0][2][1]).to.be.approximately(53.52 - 5, 1e-5);
            expect(obj.geometry.coordinates[0][3][0]).to.be.approximately(10.24, 1e-5);
            expect(obj.geometry.coordinates[0][3][1]).to.be.approximately(53.52, 1e-5);
            expect(obj.properties).to.deep.equal({visible: true});
        });
    });

});
