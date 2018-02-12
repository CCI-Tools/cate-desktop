import * as Cesium from "cesium"


export const pointHeight = 10;
export const polylineHeight = 5;
export const polygonHeight = 0;

export const pointColor = Cesium.Color.ORANGE.withAlpha(0.9);
export const polylineColor = Cesium.Color.YELLOW.withAlpha(0.9);
export const polygonColor = Cesium.Color.BLUE.withAlpha(0.5);


export interface ToolContext {
    addEntity(entity);

    addToolEntity(entity);

    removeAllToolEntities(): void;

    pickEllipsoid(position);

    cartesianWithHeightDelta(cartesian, height: number);

    cartesianToCartographic(cartesian);

    cartographicToCartesian(cartographic);
}

export abstract class ToolContextBase implements ToolContext {
    private _tool: Tool;

    constructor() {
    }

    set tool(tool: Tool) {
        this._tool = tool;
        tool.context = this;
    }

    get tool() {
        return this._tool;
    }

    onLeftClick(leftClick) {
        this._tool.handleLeftClick(leftClick);
    }

    onLeftDoubleClick(leftClick) {
        this._tool.handleLeftDoubleClick(leftClick);
    }

    onMouseMove(movement) {
        this._tool.handleMouseMove(movement);
    }

    abstract addEntity(entity);

    abstract addToolEntity(entity);

    abstract removeAllToolEntities(): void;

    abstract pickEllipsoid(position);

    abstract cartesianWithHeightDelta(cartesian, delta: number);

    abstract cartesianToCartographic(cartesian);

    abstract cartographicToCartesian(cartographic);
}


export class CesiumToolContext extends ToolContextBase {
    private _viewer: Cesium.Viewer;
    private _ellipsoid: Cesium.Ellipsoid;
    private _toolDataSource: Cesium.CustomDataSource;
    private _handlerFactory;
    private _handler;

    constructor(viewer: Cesium.Viewer) {
        super();
        this._viewer = viewer;
        this._ellipsoid = viewer.scene.globe.ellipsoid;
        this._toolDataSource = new Cesium.CustomDataSource("Tool Data Source");
        viewer.dataSources.add(this._toolDataSource);
        const handler = this._handlerFactory ? this._handlerFactory(viewer) : new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction(leftClick => this.onLeftClick(leftClick), Cesium.ScreenSpaceEventType.LEFT_CLICK);
        handler.setInputAction(leftClick => this.onLeftDoubleClick(leftClick), Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        handler.setInputAction(movement => this.onMouseMove(movement), Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this._handler = handler;
    }

    addEntity(entity) {
        return this._viewer.entities.add(entity);
    }

    addToolEntity(entity) {
        return this._toolDataSource.add(entity);
    }

    removeAllToolEntities(): void {
        this._toolDataSource.entities.removeAll();
    }

    pickEllipsoid(position) {
        return this._viewer.camera.pickEllipsoid(position, this._ellipsoid);
    }

    cartesianWithHeightDelta(cartesian, delta: number) {
        const cartographic = this._ellipsoid.cartesianToCartographic(cartesian);
        cartographic.height += delta;
        return this._ellipsoid.cartographicToCartesian(cartographic);
    }

    cartesianToCartographic(cartesian) {
        return this._ellipsoid.cartesianToCartographic(cartesian);
    }

    cartographicToCartesian(cartographic) {
        return this._ellipsoid.cartographicToCartesian(cartographic);
    }

    dispose() {
        this._handler = this._handler && this._handler.destroy();
    }
}

export interface Tool {
    context: ToolContext;

    handleLeftClick(leftClick);

    handleLeftDoubleClick(leftClick);

    handleMouseMove(movement);
}


abstract class ToolBase implements Tool {
    private _context: ToolContext;

    set context(context: ToolContext) {
        this._context = context;
    }

    get context() {
        return this._context;
    }

    handleLeftClick(leftClick) {
    }

    handleLeftDoubleClick(leftClick) {
    }

    handleMouseMove(movement) {
    }
}

export class PointTool extends ToolBase {

    constructor() {
        super();
    }

    handleLeftClick(leftClick) {
        this.context.addEntity({
                                   point: {
                                       position: leftClick.position
                                   }
                               });
    }
}

class PolyTool extends ToolBase {

    private readonly genPolygon: boolean;

    // Note polylinePositions and polygonPositions differ in height
    private polylinePositions;
    private polygonPositions;

    private polylineEntity;
    private polygonEntity;

    private hasRubberband;

    constructor(genPolygon: boolean) {
        super();
        this.genPolygon = genPolygon;
    }

    handleLeftClick(leftClick) {
        this.addPoint(leftClick.position, false);
    }

    handleLeftDoubleClick(leftClick) {
        this.addPoint(leftClick.position, true);
    }

    handleMouseMove(movement) {
        this.moveLastPoint(movement.endPosition);
    }

    private addPoint(position, endInteraction: boolean) {
        const cartesian = this.context.pickEllipsoid(position);
        if (cartesian) {
            const position = this.context.cartesianWithHeightDelta(cartesian, pointHeight);
            // Add point graphics
            this.context.addToolEntity({
                                           position: position,
                                           allowPicking: false,
                                           point: {
                                               show: true,
                                               outlineColor: Cesium.Color.BLACK,
                                               outlineWidth: 1,
                                               color: pointColor,
                                               pixelSize: 10,
                                           }
                                       });
            this.updatePositions(cartesian);
            this.hasRubberband = false;
        }
        if (endInteraction) {
            if (this.polygonEntity) {
                // TODO #477 (nf): mark this as a user-polygon so we can edit points later
                const polygon = this.context.addEntity({
                                                           polygon: {
                                                               // TODO (nf): why doesn't this work?
                                                               // hierarchy: this.polygonEntity.hierarchy,
                                                               hierarchy: this.polygonPositions,
                                                               // TODO (nf): take from current style
                                                               material: polygonColor,
                                                           }
                                                       });
            } else if (this.polylineEntity) {
                // TODO #477 (nf): mark this as a user-polygon so we can edit points later
                const polyline = this.context.addEntity({
                                                            polyline: {
                                                                // TODO (nf): why doesn't this work?
                                                                // positions: this.polylinePositions.positions,
                                                                positions: this.polylinePositions,
                                                                // TODO (nf): take from current style
                                                                material: polylineColor,
                                                            }
                                                        });
            }
            this.reset();
        }
    }

    private moveLastPoint(position) {
        if (!this.polylinePositions) {
            return;
        }
        const cartesian = this.context.pickEllipsoid(position);
        if (cartesian) {
            this.updatePositions(cartesian);
            this.hasRubberband = true;
        }
    }

    private updatePositions(cartesian) {
        const polylinePoint = this.context.cartesianWithHeightDelta(cartesian, polylineHeight);
        if (!this.polylinePositions) {
            this.polylinePositions = [polylinePoint];
        } else {
            if (this.hasRubberband) {
                const numPoints = this.polylinePositions.length;
                this.polylinePositions[numPoints - 1] = polylinePoint;
            } else {
                this.polylinePositions.push(polylinePoint);
            }
        }
        if (this.polylinePositions.length > 1) {
            let positions = this.polylinePositions.slice();
            if (!this.polylineEntity) {
                this.polylineEntity = this.context.addToolEntity({
                                                                     allowPicking: false,
                                                                     polyline: {
                                                                         positions: positions,
                                                                         width: 2,
                                                                         followSurface: true,
                                                                         material: polylineColor,
                                                                     }
                                                                 });
            } else {
                // TODO (nf): optimize me, this seems slow!
                this.polylineEntity.polyline.positions = positions;
            }
        }


        if (this.genPolygon) {
            const polygonPoint = this.context.cartesianWithHeightDelta(cartesian, polygonHeight);
            if (!this.polygonPositions) {
                this.polygonPositions = [polygonPoint];
            } else {
                if (this.hasRubberband) {
                    const numPoints = this.polygonPositions.length;
                    this.polygonPositions[numPoints - 1] = polygonPoint;
                } else {
                    this.polygonPositions.push(polygonPoint);
                }
            }
            if (this.polygonPositions && this.polygonPositions.length > 2) {
                let positions = this.polygonPositions.slice();
                if (!this.polygonEntity) {
                    this.polygonEntity = this.context.addToolEntity({
                                                                        allowPicking: false,
                                                                        polygon: {
                                                                            hierarchy: positions,
                                                                            material: polygonColor,
                                                                        }
                                                                    });
                } else {
                    this.polygonEntity.polygon.hierarchy = positions;
                }
            }
        }
    }

    private reset() {
        this.polylinePositions = null;
        this.polygonPositions = null;
        this.polylineEntity = null;
        this.polygonEntity = null;
        this.hasRubberband = false;
        this.context.removeAllToolEntities();
    }

}

export class PolylineTool extends PolyTool {

    constructor() {
        super(false);
    }
}

export class PolygonTool extends PolyTool {

    constructor() {
        super(true);
    }
}

export class BoxTool extends ToolBase {

    private position1;
    private position2;
    private polygonEntity;

    handleLeftClick(leftClick) {
        this.setPosition(leftClick.position, true);
    }

    handleLeftDoubleClick(leftClick) {
        this.setPosition(leftClick.position, true);
    }

    handleMouseMove(movement) {
        if (this.position1) {
            this.setPosition(movement.endPosition, false);
        }
    }

    private setPosition(position: any, doAdd: boolean) {
        const cartesian = this.context.pickEllipsoid(position);
        if (cartesian) {
            if (!this.position1) {
                this.position1 = cartesian;
            } else {
                this.position2 = cartesian;
                const positions = this.getPositions()
                if (doAdd) {
                    this.context.addEntity({
                                               polygon: {
                                                   hierarchy: positions,
                                                   material: polygonColor,
                                               }
                                           });
                    this.reset();
                    return;
                }
                if (!this.polygonEntity) {
                    this.polygonEntity = this.context.addToolEntity({
                                                                        allowPicking: false,
                                                                        polygon: {
                                                                            hierarchy: positions,
                                                                            material: polygonColor,
                                                                        }
                                                                    });
                } else {
                    this.polygonEntity.polygon.hierarchy = positions;
                }
            }
        }
    }

    private getPositions() {
        const carto1 = this.context.cartesianToCartographic(this.position1);
        const carto2 = this.context.cartesianToCartographic(this.position2);
        const lon1 = carto1.longitude;
        const lat1 = carto1.latitude;
        const lon2 = carto2.longitude;
        const lat2 = carto2.latitude;
        const height = 0.5 * (carto1.height + carto2.height);
        return [
            this.context.cartographicToCartesian({longitude: lon1, latitude: lat1, height}),
            this.context.cartographicToCartesian({longitude: lon2, latitude: lat1, height}),
            this.context.cartographicToCartesian({longitude: lon2, latitude: lat2, height}),
            this.context.cartographicToCartesian({longitude: lon1, latitude: lat2, height}),
        ];
    }


    reset() {
        this.position1 = this.position2 = null;
        this.polygonEntity = null;
        this.context.removeAllToolEntities();
    }
}

