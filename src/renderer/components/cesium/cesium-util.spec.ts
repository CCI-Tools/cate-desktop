import {expect} from 'chai';
import * as Cesium from "cesium";
import {entityToGeoJSON} from "./cesium-util";
import {polygonColor} from "./GeometryTool";


describe('cesium-util', function () {
    describe('entityToGeoJSON', function () {

        it('works for null entities', function () {
            let obj = entityToGeoJSON(null);
            expect(obj).to.equal(null);
        });

        it('works for point entities', function () {

            let position = Cesium.Cartographic.toCartesian({
                                                               longitude: Cesium.Math.toRadians(10.24),
                                                               latitude: Cesium.Math.toRadians(53.52),
                                                               height: 0.0
                                                           });

            let obj = entityToGeoJSON({
                                          position: new Cesium.ConstantPositionProperty(position),
                                          point: {
                                              show: true,
                                              outlineColor: new Cesium.ConstantProperty(Cesium.Color.RED),
                                              outlineWidth: new Cesium.ConstantProperty(1.5),
                                              color: new Cesium.ConstantProperty(Cesium.Color.WHITE),
                                              pixelSize: new Cesium.ConstantProperty(10),
                                          }
                                      }, "bibo-643");

            expect(obj).to.exist;
            expect(obj.type).to.equal("Feature");
            expect(obj.id).to.equal("bibo-643");
            expect(obj.geometry).to.exist;
            expect(obj.geometry.type).to.equal("Point");
            expect(obj.geometry.coordinates).to.exist;
            expect(obj.geometry.coordinates.length).to.equal(2);
            expect(obj.geometry.coordinates[0]).to.be.approximately(10.24, 1e-5);
            expect(obj.geometry.coordinates[1]).to.be.approximately(53.52, 1e-5);
            expect(obj.properties).to.deep.equal({
                                                     "stroke": "#ff0000",
                                                     "stroke-width": 1.5,
                                                     "marker-color": "#ffffff",
                                                     "marker-size": "medium",
                                                 });
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

            let obj = entityToGeoJSON({
                                          polyline: {
                                              positions: new Cesium.ConstantProperty(positions),
                                              material: new Cesium.ColorMaterialProperty(Cesium.Color.BLUE),
                                              width: new Cesium.ConstantProperty(3.5),
                                          }
                                      }, "bibo-644");

            expect(obj).to.exist;
            expect(obj.type).to.equal("Feature");
            expect(obj.id).to.equal("bibo-644");
            expect(obj.geometry).to.exist;
            expect(obj.geometry.type).to.equal("Polyline");
            expect(obj.geometry.coordinates).to.exist;
            expect(obj.geometry.coordinates.length).to.equal(3);
            expect(obj.geometry.coordinates[0][0]).to.be.approximately(10.24, 1e-5);
            expect(obj.geometry.coordinates[0][1]).to.be.approximately(53.52, 1e-5);
            expect(obj.geometry.coordinates[1][0]).to.be.approximately(10.24 + 10, 1e-5);
            expect(obj.geometry.coordinates[1][1]).to.be.approximately(53.52, 1e-5);
            expect(obj.geometry.coordinates[2][0]).to.be.approximately(10.24 + 10, 1e-5);
            expect(obj.geometry.coordinates[2][1]).to.be.approximately(53.52 - 5, 1e-5);
            expect(obj.properties).to.deep.equal({
                                                     "stroke": "#0000ff",
                                                     "stroke-width": 3.5,
                                                     "stroke-opacity": 1,
                                                 });
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

            let obj = entityToGeoJSON({
                                          polygon: {
                                              hierarchy: new Cesium.ConstantProperty({positions}),
                                              material: new Cesium.ColorMaterialProperty(Cesium.Color.YELLOW.withAlpha(0.7)),
                                              outlineWidth: new Cesium.ConstantProperty(2.8),
                                              outlineColor: new Cesium.ConstantProperty(Cesium.Color.BLACK.withAlpha(0.4)),
                                          }
                                      }, "bibo-645");

            expect(obj).to.exist;
            expect(obj.type).to.equal("Feature");
            expect(obj.id).to.equal("bibo-645");
            expect(obj.geometry).to.exist;
            expect(obj.geometry.type).to.equal("Polygon");
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
            expect(obj.properties).to.deep.equal({
                                                     "fill": "#ffff00",
                                                     "fill-opacity": 0.7,
                                                     "stroke": "#000000",
                                                     "stroke-opacity": 0.4,
                                                     "stroke-width": 2.8,
                                                 });
        });
    });

});
