// Paste this file's contents into the Cesium Sandcastle editor
// https://cesiumjs.org/Cesium/Apps/Sandcastle/?src=Hello%20World.html&label=
//
// Note, the code must remain ES6 JavaScript.

const viewer = new Cesium.Viewer('cesiumContainer', {});

const scene = viewer.scene;
let handler;

let editingDataSource = new Cesium.CustomDataSource("editingDataSource");
viewer.dataSources.add(editingDataSource);
editingDataSource.entities.show = true;

let positions;
let polylineEntity;
let polylinePositions;
let polygonEntity;
let polygonPositions;
let hasMoved;

const pointHeight = 10;
const polylineHeight = 5;
const polygonHeight = 0;

const pointColor = Cesium.Color.ORANGE.withAlpha(0.9);
const polylineColor = Cesium.Color.YELLOW.withAlpha(0.9);
const polygonColor = Cesium.Color.BLUE.withAlpha(0.5);

function cartesianWithHeight(cartesian, height, ellipsoid) {
    let cartographic = ellipsoid.cartesianToCartographic(cartesian);
    cartographic.height = height;
    return ellipsoid.cartographicToCartesian(cartographic);
}

function updatePoints(cartesian, doAdd, ellipsoid) {
    const polylinePoint = cartesianWithHeight(cartesian, polylineHeight, ellipsoid);
    const polygonPoint = cartesianWithHeight(cartesian, polygonHeight, ellipsoid);

    if (!positions) {
        positions = [cartesian];
        polylinePositions = [polylinePoint];
        polygonPositions = [polygonPoint];
    } else {
        if (doAdd) {
            positions.push(cartesian);
            polylinePositions.push(polylinePoint);
            polygonPositions.push(polygonPoint);
        } else {
            const numPoints = positions.length;
            positions[numPoints - 1] = cartesian;
            polylinePositions[numPoints - 1] = polylinePoint;
            polygonPositions[numPoints - 1] = polygonPoint;
        }
    }

    if (positions.length > 1) {
        if (!polylineEntity) {
            polylineEntity = editingDataSource.entities.add({
                id: 'PolygonOutline',
                allowPicking: false,
                polyline: {
                    positions: polylinePositions,
                    width: 2,
                    followSurface: true,
                    material: polylineColor,
                }
            });
        } else {
            polylineEntity.polyline.positions = polylinePositions.slice();
        }
    }

    if (positions.length > 2) {
        if (!polygonEntity) {
            polygonEntity = editingDataSource.entities.add({
                id: 'PolygonInterior',
                allowPicking: false,
                polygon: {
                    hierarchy: polygonPositions,
                    material: polygonColor,
                }
            });
        } else {
            polygonEntity.polygon.hierarchy = polygonPositions.slice();
        }
    }
}

function addPoint(position, end) {
    const ellipsoid = scene.globe.ellipsoid;
    const cartesian = viewer.camera.pickEllipsoid(position, ellipsoid);
    if (cartesian) {
        editingDataSource.entities.add({
            position: cartesianWithHeight(cartesian, pointHeight, ellipsoid),
            allowPicking: false,
            point: {
                show: true,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 1,
                color: pointColor,
                pixelSize: 10,
            }
        });
        updatePoints(cartesian, true, ellipsoid);
        console.log("added point, positions: ", positions);
    }
    if (end) {
        editingDataSource.entities.removeAll();
        if (polygonEntity) {
            // TODO: mark this as a user-polygon so we can edit points later
            const polygon = viewer.entities.add({
                polygon: {
                    hierarchy: polygonPositions,
                    material: polygonColor,
                }
            });
            console.log("entity added: ", polygon);
        }
        resetPoints();
        handler = handler && handler.destroy();
    }
}

function moveLastPoint(position) {
    if (!positions) {
        return;
    }
    const ellipsoid = scene.globe.ellipsoid;
    const cartesian = viewer.camera.pickEllipsoid(position, ellipsoid);
    if (cartesian) {
        updatePoints(cartesian, !hasMoved, ellipsoid);
        hasMoved = true;
    }
}

function resetPoints() {
    positions = null;
    polylineEntity = null;
    polygonEntity = null;
    polylinePositions = null;
    polygonPositions = null;
}

Sandcastle.addDefaultToolbarButton('Add Polygon', function () {
    editingDataSource.entities.removeAll();
    resetPoints();
    hasMoved = false;

    handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    handler.setInputAction(leftClick => addPoint(leftClick.position, false), Cesium.ScreenSpaceEventType.LEFT_CLICK);
    handler.setInputAction(leftClick => addPoint(leftClick.position, true), Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    handler.setInputAction(movement => moveLastPoint(movement.endPosition), Cesium.ScreenSpaceEventType.MOUSE_MOVE);
});

Sandcastle.reset = function () {
    viewer.entities.removeAll();
    handler = handler && handler.destroy();
};
