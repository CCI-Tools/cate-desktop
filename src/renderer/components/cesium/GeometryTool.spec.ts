import {should, expect} from 'chai';
import {
    ToolContextBase, PolygonTool, PolylineTool, polylineColor, polygonColor, PointTool,
    BoxTool, NO_TOOL
} from "./GeometryTool";


class TestToolContext extends ToolContextBase {
    entities: any[];
    toolEntities: any[];

    constructor() {
        super();
        this.entities = [];
        this.toolEntities = [];
    }

    addEntity(entity) {
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
        return {...position, height: 0};
    }

    cartesianWithHeightDelta(cartesian, delta: number) {
        return {...cartesian, height: delta};
    }


    cartesianToCartographic(cartesian) {
        return {...cartesian};
    }

    cartographicToCartesian(cartographic) {
        return {...cartographic};
    }
}


describe('GeometryTool', function () {
    it('NoTool', function () {
        const toolContext = new TestToolContext();
        expect(toolContext.tool).to.equal(NO_TOOL);

        toolContext.onMouseMove({endPosition: {longitude: 10, latitude: 11}});
        toolContext.onMouseMove({endPosition: {longitude: 12, latitude: 9}});
        toolContext.onLeftClick({position: {longitude: 10, latitude: 12}});
        toolContext.onMouseMove({endPosition: {longitude: 13, latitude: 11}});
        toolContext.onMouseMove({endPosition: {longitude: 18, latitude: 0}});
        toolContext.onLeftClick({position: {longitude: 20, latitude: 15}});
        toolContext.onMouseMove({endPosition: {longitude: 13, latitude: 11}});

        expect(toolContext.entities).to.exist;
        expect(toolContext.entities).to.deep.equal([]);
    });

    it('PointTool', function () {
        const toolContext = new TestToolContext();
        toolContext.tool = new PointTool();

        toolContext.onMouseMove({endPosition: {longitude: 10, latitude: 11}});
        toolContext.onMouseMove({endPosition: {longitude: 12, latitude: 9}});
        toolContext.onLeftClick({position: {longitude: 10, latitude: 12}});
        toolContext.onMouseMove({endPosition: {longitude: 13, latitude: 11}});
        toolContext.onMouseMove({endPosition: {longitude: 18, latitude: 0}});
        toolContext.onLeftClick({position: {longitude: 20, latitude: 15}});
        toolContext.onMouseMove({endPosition: {longitude: 13, latitude: 11}});

        expect(toolContext.entities).to.exist;
        expect(toolContext.entities).to.deep.equal([
                                                       {
                                                           position: {height: 0, longitude: 10, latitude: 12},
                                                           point: {
                                                               outlineWidth: 1,
                                                               pixelSize: 6,
                                                           }
                                                       },
                                                       {
                                                           position: {height: 0, longitude: 20, latitude: 15},
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

        toolContext.onMouseMove({endPosition: {longitude: 10, latitude: 11}});
        toolContext.onMouseMove({endPosition: {longitude: 12, latitude: 9}});
        toolContext.onLeftClick({position: {longitude: 10, latitude: 10}});
        toolContext.onMouseMove({endPosition: {longitude: 13, latitude: 11}});
        toolContext.onMouseMove({endPosition: {longitude: 18, latitude: 0}});
        toolContext.onLeftClick({position: {longitude: 20, latitude: 10}});
        toolContext.onMouseMove({endPosition: {longitude: 21, latitude: 11}});
        toolContext.onMouseMove({endPosition: {longitude: 19, latitude: 15}});
        toolContext.onLeftDoubleClick({position: {longitude: 20, latitude: 20}});
        toolContext.onMouseMove({endPosition: {longitude: 46, latitude: 26}});
        toolContext.onMouseMove({endPosition: {longitude: 49, latitude: 32}});

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
                        {longitude: 10, latitude: 10, height: 5},
                        {longitude: 20, latitude: 10, height: 5},
                        {longitude: 20, latitude: 20, height: 5}
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

        toolContext.onMouseMove({endPosition: {longitude: 10, latitude: 11}});
        toolContext.onMouseMove({endPosition: {longitude: 12, latitude: 9}});
        toolContext.onLeftClick({position: {longitude: 10, latitude: 10}});
        toolContext.onMouseMove({endPosition: {longitude: 13, latitude: 11}});
        toolContext.onMouseMove({endPosition: {longitude: 18, latitude: 0}});
        toolContext.onLeftClick({position: {longitude: 20, latitude: 10}});
        toolContext.onMouseMove({endPosition: {longitude: 21, latitude: 11}});
        toolContext.onMouseMove({endPosition: {longitude: 19, latitude: 15}});
        toolContext.onLeftDoubleClick({position: {longitude: 20, latitude: 20}});
        toolContext.onMouseMove({endPosition: {longitude: 46, latitude: 26}});
        toolContext.onMouseMove({endPosition: {longitude: 49, latitude: 32}});

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
                        {longitude: 10, latitude: 10, height: 0},
                        {longitude: 20, latitude: 10, height: 0},
                        {longitude: 20, latitude: 20, height: 0}
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

        toolContext.onMouseMove({endPosition: {longitude: 10, latitude: 11}});
        toolContext.onMouseMove({endPosition: {longitude: 12, latitude: 16}});
        toolContext.onLeftClick({position: {longitude: 10, latitude: 20}});
        toolContext.onMouseMove({endPosition: {longitude: 13, latitude: 28}});
        toolContext.onMouseMove({endPosition: {longitude: 28, latitude: 32}});
        toolContext.onLeftClick({position: {longitude: 30, latitude: 40}});
        toolContext.onMouseMove({endPosition: {longitude: 31, latitude: 41}});
        toolContext.onMouseMove({endPosition: {longitude: 39, latitude: 35}});

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
                        {longitude: 10, latitude: 20, height: 0},
                        {longitude: 30, latitude: 20, height: 0},
                        {longitude: 30, latitude: 40, height: 0},
                        {longitude: 10, latitude: 40, height: 0},
                    ],
                    material: polygonColor
                }
            }
        );

        expect(toolContext.toolEntities).to.exist;
        expect(toolContext.toolEntities).to.deep.equal([]);
    });

});
