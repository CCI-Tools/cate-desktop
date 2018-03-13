import {expect} from 'chai';
import {
    ToolContextBase, PolygonTool, PolylineTool, polylineColor, polygonColor, PointTool,
    BoxTool, NO_TOOL
} from "./geometry-tool";


class Point {
    readonly longitude: number;
    readonly latitude: number;
    readonly height?: number;

    constructor(longitude: number, latitude: number, height?: number) {
        this.longitude = longitude;
        this.latitude = latitude;
        this.height = height;
    }

    // noinspection JSUnusedGlobalSymbols
    equals(point: Point) {
        return this.longitude === point.longitude && this.latitude === point.latitude && this.height === point.height;
    }
}

function newPoint(p) {
    return new Point(p.longitude, p.latitude, p.height);
}

class TestToolContext extends ToolContextBase {
    entities: any[];
    toolEntities: any[];

    constructor() {
        super();
        this.entities = [];
        this.toolEntities = [];
    }

    newEntity(entity) {
        this.entities.push(entity);
        return entity;
    }

    addToolEntity(entity) {
        this.toolEntities.push(entity);
        return entity;
    }

    removeAllToolEntities(): void {
        this.toolEntities = [];
    }

    pickEllipsoid(position) {
        return newPoint({...position, height: 0});
    }

    cartesianWithHeightDelta(cartesian, delta: number) {
        return newPoint({...cartesian, height: delta});
    }


    cartesianToCartographic(cartesian) {
        return newPoint({...cartesian});
    }

    cartographicToCartesian(cartographic) {
        return newPoint({...cartographic});
    }
}


describe('GeometryTool', function () {
    it('NoTool', function () {
        const toolContext = new TestToolContext();
        expect(toolContext.tool).to.equal(NO_TOOL);

        toolContext.onMouseMove({endPosition: newPoint({longitude: 10, latitude: 11})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 12, latitude: 9})});
        toolContext.onLeftClick({position: newPoint({longitude: 10, latitude: 12})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 13, latitude: 11})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 18, latitude: 0})});
        toolContext.onLeftClick({position: newPoint({longitude: 20, latitude: 15})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 13, latitude: 11})});

        expect(toolContext.entities).to.exist;
        expect(toolContext.entities).to.deep.equal([]);
    });

    it('PointTool', function () {
        const toolContext = new TestToolContext();
        toolContext.tool = new PointTool();

        toolContext.onMouseMove({endPosition: newPoint({longitude: 10, latitude: 11})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 12, latitude: 9})});
        toolContext.onLeftClick({position: newPoint({longitude: 10, latitude: 12})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 13, latitude: 11})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 18, latitude: 0})});
        toolContext.onLeftClick({position: newPoint({longitude: 20, latitude: 15})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 13, latitude: 11})});

        expect(toolContext.entities).to.exist;
        expect(toolContext.entities).to.deep.equal([
                                                       {
                                                           position: newPoint({height: 0, longitude: 10, latitude: 12}),
                                                           point: {
                                                               outlineWidth: 1,
                                                               pixelSize: 6,
                                                           }
                                                       },
                                                       {
                                                           position: newPoint({height: 0, longitude: 20, latitude: 15}),
                                                           point: {
                                                               outlineWidth: 1,
                                                               pixelSize: 6,
                                                           }
                                                       }]);

        expect(toolContext.toolEntities).to.exist;
        expect(toolContext.toolEntities).to.deep.equal([]);
    });

    it('PolylineTool', function () {
        const toolContext = new TestToolContext();
        toolContext.tool = new PolylineTool();

        toolContext.onMouseMove({endPosition: newPoint({longitude: 10, latitude: 11})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 12, latitude: 9})});
        toolContext.onLeftClick({position: newPoint({longitude: 10, latitude: 10})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 13, latitude: 11})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 18, latitude: 0})});
        toolContext.onLeftClick({position: newPoint({longitude: 20, latitude: 10})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 21, latitude: 11})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 19, latitude: 15})});
        // Note, we simulate here a browser sensing two(!) left click events before a double-click event.
        // See also https://github.com/AnalyticalGraphicsInc/cesium/issues/1171
        let endPoint = {position: newPoint({longitude: 20, latitude: 20})};
        toolContext.onLeftClick(endPoint);
        toolContext.onLeftClick(endPoint);
        toolContext.onLeftDoubleClick(endPoint);
        toolContext.onMouseMove({endPosition: newPoint({longitude: 46, latitude: 26})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 49, latitude: 32})});

        expect(toolContext.entities).to.exist;
        expect(toolContext.entities.length).to.equal(1);
        const entity = toolContext.entities[0];
        expect(entity.polyline).to.exist;
        expect(entity.polyline.positions).to.exist;
        expect(entity.polyline.positions.length).to.equal(3);
        expect(entity).to.deep.equal(
            {
                polyline: {
                    positions: [
                        newPoint({longitude: 10, latitude: 10, height: 5}),
                        newPoint({longitude: 20, latitude: 10, height: 5}),
                        newPoint({longitude: 20, latitude: 20, height: 5})
                    ],
                    material: polylineColor
                }
            }
        );

        expect(toolContext.toolEntities).to.exist;
        expect(toolContext.toolEntities).to.deep.equal([]);
    });

    it('PolygonTool', function () {
        const toolContext = new TestToolContext();
        toolContext.tool = new PolygonTool();

        toolContext.onMouseMove({endPosition: newPoint({longitude: 10, latitude: 11})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 12, latitude: 9})});
        toolContext.onLeftClick({position: newPoint({longitude: 10, latitude: 10})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 13, latitude: 11})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 18, latitude: 0})});
        toolContext.onLeftClick({position: newPoint({longitude: 20, latitude: 10})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 21, latitude: 11})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 19, latitude: 15})});
        // Note, we simulate here a browser sensing two(!) left click events before a double-click event.
        // See also https://github.com/AnalyticalGraphicsInc/cesium/issues/1171
        let endPoint = {position: newPoint({longitude: 20, latitude: 20})};
        toolContext.onLeftClick(endPoint);
        toolContext.onLeftClick(endPoint);
        toolContext.onLeftDoubleClick(endPoint);
        toolContext.onMouseMove({endPosition: newPoint({longitude: 46, latitude: 26})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 49, latitude: 32})});

        expect(toolContext.entities).to.exist;
        expect(toolContext.entities.length).to.equal(1);
        const entity = toolContext.entities[0];
        expect(entity.polygon).to.exist;
        expect(entity.polygon.hierarchy).to.exist;
        expect(entity.polygon.hierarchy.length).to.equal(3);
        expect(entity).to.deep.equal(
            {
                polygon: {
                    hierarchy: [
                        newPoint({longitude: 10, latitude: 10, height: 0}),
                        newPoint({longitude: 20, latitude: 10, height: 0}),
                        newPoint({longitude: 20, latitude: 20, height: 0})
                    ],
                    material: polygonColor
                }
            }
        );

        expect(toolContext.toolEntities).to.exist;
        expect(toolContext.toolEntities).to.deep.equal([]);
    });

    it('BoxTool', function () {
        const toolContext = new TestToolContext();
        toolContext.tool = new BoxTool();

        toolContext.onMouseMove({endPosition: newPoint({longitude: 10, latitude: 11})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 12, latitude: 16})});
        toolContext.onLeftClick({position: newPoint({longitude: 10, latitude: 20})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 13, latitude: 28})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 28, latitude: 32})});
        toolContext.onLeftClick({position: newPoint({longitude: 30, latitude: 40})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 31, latitude: 41})});
        toolContext.onMouseMove({endPosition: newPoint({longitude: 39, latitude: 35})});

        expect(toolContext.entities).to.exist;
        expect(toolContext.entities.length).to.equal(1);
        const entity = toolContext.entities[0];
        expect(entity.polygon).to.exist;
        expect(entity.polygon.hierarchy).to.exist;
        expect(entity.polygon.hierarchy.length).to.equal(4);
        expect(entity).to.deep.equal(
            {
                polygon: {
                    hierarchy: [
                        newPoint({longitude: 10, latitude: 20, height: 0}),
                        newPoint({longitude: 30, latitude: 20, height: 0}),
                        newPoint({longitude: 30, latitude: 40, height: 0}),
                        newPoint({longitude: 10, latitude: 40, height: 0}),
                    ],
                    material: polygonColor
                }
            }
        );

        expect(toolContext.toolEntities).to.exist;
        expect(toolContext.toolEntities).to.deep.equal([]);
    });

});
