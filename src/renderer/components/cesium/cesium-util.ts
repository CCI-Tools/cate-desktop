import {isDefined, isNumber, isString} from "../../../../app/common/types";
import {SIMPLE_STYLE_DEFAULTS, SimpleStyle} from "../../../../app/common/geojson-simple-style";
import * as Cesium from "cesium";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SimpleStyle

export interface CesiumSimpleStyle {
    markerSymbol?: string;
    markerColor?: Cesium.Color;
    markerSize?: number;
    markerCanvas?: HTMLCanvasElement;
    stroke?: Cesium.Color;
    strokeWidth?: number;
    fill?: Cesium.Color;
    title?: string;
    description?: string;
}

const MARKER_SIZE_SMALL = 32;
const MARKER_SIZE_MEDIUM = 48;
const MARKER_SIZE_LARGE = 64;

export function simpleStyleToCesium(style: SimpleStyle, defaults?: SimpleStyle): CesiumSimpleStyle {
    const cStyle: CesiumSimpleStyle = {};

    if (isString(style.stroke) || isNumber(style.strokeOpacity) || isNumber(style.strokeWidth)) {
        const stroke = getString("stroke", style, defaults, SIMPLE_STYLE_DEFAULTS);
        let color = Cesium.Color.fromCssColorString(stroke);
        const strokeWidth = getNumber("strokeWidth", style, defaults, SIMPLE_STYLE_DEFAULTS);
        const strokeOpacity = getNumber("strokeOpacity", style, defaults, SIMPLE_STYLE_DEFAULTS);
        if (strokeOpacity >= 0.0 && strokeOpacity < 1.0) {
            color = Cesium.Color.fromAlpha(color, strokeOpacity);
        }
        cStyle.stroke = color;
        cStyle.strokeWidth = strokeWidth;
    }

    if (isString(style.fill) || isNumber(style.fillOpacity)) {
        const fill = getString("fill", style, defaults, SIMPLE_STYLE_DEFAULTS);
        let color = Cesium.Color.fromCssColorString(fill);
        const fillOpacity = getNumber("fillOpacity", style, defaults, SIMPLE_STYLE_DEFAULTS);
        if (fillOpacity >= 0.0 && fillOpacity < 1.0) {
            color = Cesium.Color.fromAlpha(color, fillOpacity);
        }
        cStyle.fill = color;
    }

    if (isString(style.markerSymbol) || isString(style.markerColor) || isNumber(style.markerSize)) {
        const markerSize = getString("markerSize", style, defaults, SIMPLE_STYLE_DEFAULTS);
        const markerSymbol = getString("markerSymbol", style, defaults, SIMPLE_STYLE_DEFAULTS);
        const markerColor = getString("markerColor", style, defaults, SIMPLE_STYLE_DEFAULTS);
        const color = Cesium.Color.fromCssColorString(markerColor);
        const size = markerSize === "small" ? MARKER_SIZE_SMALL : markerSize === "large" ? MARKER_SIZE_LARGE : MARKER_SIZE_MEDIUM;
        const pinBuilder = new Cesium.PinBuilder();
        let markerCanvas;
        if (markerSymbol === "") {
            markerCanvas = pinBuilder.fromColor(color, size);
        } else if (markerSymbol.length === 1) {
            markerCanvas = pinBuilder.fromText(markerSymbol, color, size);
            cStyle.markerSymbol = markerSymbol;
        } else {
            markerCanvas = pinBuilder.fromMakiIconId(markerSymbol, color, size);
            cStyle.markerSymbol = markerSymbol;
        }
        cStyle.markerSize = size;
        cStyle.markerColor = color;
        cStyle.markerCanvas = markerCanvas;
    }

    if (isString(style.title)) {
        cStyle.title = style.title;
    }

    if (isString(style.description)) {
        cStyle.description = style.description;
    }

    return cStyle;
}

export function entityToSimpleStyle(entity: Cesium.Entity | null): SimpleStyle | null {
    if (!entity) {
        return null;
    } else if (entity.point) {
        return pointGraphicsToSimpleStyle(entity.point);
    } else if (entity.billboard) {
        return billboardGraphicsToSimpleStyle(entity.billboard);
    } else if (entity.label) {
        return labelGraphicsToSimpleStyle(entity.label);
    } else if (entity.polyline) {
        return polylineGraphicsToSimpleStyle(entity.polyline);
    } else if (entity.polygon) {
        return polygonGraphicsToSimpleStyle(entity.polygon);
    }
    return null;
}

export function applyStyleToEntityCollection(style: CesiumSimpleStyle, entities: Cesium.Entity[]): void {
    for (let entity of entities) {
        applyStyleToEntity(style, entity);
    }
}

export function applyStyleToEntity(style: CesiumSimpleStyle, entity: Cesium.Entity): void {
    if (entity.point) {
        const point = entity.point;
        if (isDefined(style.markerColor)) {
            point.color = Cesium.Color.fromCssColorString(style.markerColor);
        }
        if (isNumber(style.markerSize)) {
            point.pixelSize = 16 * (style.markerSize / MARKER_SIZE_SMALL);
        }
    } else if (entity.billboard) {
        const billboard = entity.billboard;
        if (isDefined(style.markerCanvas)) {
            billboard.image = style.markerCanvas;
        } else {
            if (isDefined(style.markerColor)) {
                billboard.color = style.markerColor;
            }
            if (isNumber(style.markerSize)) {
                billboard.scale = style.markerSize / MARKER_SIZE_MEDIUM;
            }
        }
    } else if (entity.label) {
        const label = entity.label;
        if (isDefined(style.title)) {
            label.text = style.title;
        }
        if (isDefined(style.markerColor)) {
            label.color = style.markerColor;
        }
        if (isNumber(style.markerSize)) {
            label.scale = style.markerSize / MARKER_SIZE_MEDIUM;
        }
    } else if (entity.polyline) {
        const polyline = entity.polyline;
        if (isDefined(style.stroke)) {
            polyline.material = style.stroke;
        }
        if (isNumber(style.strokeWidth)) {
            polyline.width = style.strokeWidth;
        }
    } else if (entity.polygon) {
        const polygon = entity.polygon;
        if (isDefined(style.fill)) {
            polygon.material = style.fill;
        }
        if (isDefined(style.stroke)) {
            polygon.outlineColor = style.stroke;
        }
        if (isNumber(style.strokeWidth)) {
            polygon.outlineWidth = style.strokeWidth;
        }
    }
}

function colorToHexString(value: number): string {
    if (value <= 0) {
        return "00";
    } else if (value >= 1) {
        return "ff";
    } else {
        const v = Math.floor(255.9999 * value);
        if (v <= 0) {
            return "00";
        } else if (v >= 255) {
            return "ff";
        } else if (v < 16) {
            return "0" + v.toString(16);
        } else {
            return v.toString(16);
        }
    }
}

function rgbToCssColor(r: number, g: number, b: number): string {
    const rs = colorToHexString(r);
    const gs = colorToHexString(g);
    const bs = colorToHexString(b);
    return "#" + rs + gs + bs;
}

function pointGraphicsToSimpleStyle(point: Cesium.PointGraphics) {
    const now = Cesium.JulianDate.now();
    const pixelSize = point.pixelSize;
    const color = point.color;
    let markerSize: "small" | "medium" | "large";
    let markerColor: string;
    let markerSymbol: string;
    if (isDefined(pixelSize)) {
        const pixelSizeValue = pixelSize.getValue(now);
        if (pixelSizeValue < 10) {
            markerSize = "small";
        } else if (pixelSizeValue < 20) {
            markerSize = "medium";
        } else {
            markerSize = "large";
        }
    }
    if (isDefined(color)) {
        const colorValue = color.getValue(now);
        markerColor = rgbToCssColor(colorValue.red, colorValue.green, colorValue.blue);
    }
    return {
        markerSize,
        markerColor,
        markerSymbol,
    };
}

function billboardGraphicsToSimpleStyle(point: Cesium.BillboardGraphics) {
    const now = Cesium.JulianDate.now();
    const image = point.image;
    const scale = point.scale;
    const color = point.color;
    let markerSymbol: string;
    let markerSize: "small" | "medium" | "large";
    let markerColor: string;
    if (isDefined(image)) {
        const imageValue = image.getValue(now);
        if (isString(imageValue)) {
            markerSymbol = imageValue;
        }
    }
    if (isDefined(scale)) {
        const scaleValue = scale.getValue(now);
        if (scaleValue < 1) {
            markerSize = "small";
        } else if (scaleValue < 2) {
            markerSize = "medium";
        } else {
            markerSize = "large";
        }
    }
    if (isDefined(color)) {
        const colorValue = color.getValue(now);
        markerColor = rgbToCssColor(colorValue.red, colorValue.green, colorValue.blue);
    }
    return {
        markerSymbol,
        markerSize,
        markerColor,
    };
}

function labelGraphicsToSimpleStyle(point: Cesium.LabelGraphics) {
    const text = point.text;
    const scale = point.scale;
    const fillColor = point.fillColor;
    let title: string;
    let markerSize: "small" | "medium" | "large";
    let markerColor: string;
    if (isString(text)) {
        title = text;
    }
    if (isNumber(scale)) {
        if (scale < 1) {
            markerSize = "small";
        } else if (scale < 2) {
            markerSize = "medium";
        } else {
            markerSize = "large";
        }
    }
    if (fillColor) {
        markerColor = rgbToCssColor(fillColor.red, fillColor.green, fillColor.blue);
    }
    return {
        title,
        markerSize,
        markerColor,
    };
}

function polylineGraphicsToSimpleStyle(polyline: Cesium.PolylineGraphics) {
    const now = Cesium.JulianDate.now();
    const width = polyline.width;
    const material = polyline.material;
    let stroke: string;
    let strokeOpacity: number;
    let strokeWidth: number;

    if (isDefined(width)) {
        strokeWidth = width.getValue(now);
    }
    if (isDefined(material) && isDefined(material.color)) {
        const color = material.color.getValue(now);
        stroke = rgbToCssColor(color.red, color.green, color.blue);
        strokeOpacity = color.alpha;
    }
    return {
        stroke,
        strokeOpacity,
        strokeWidth
    };
}

function polygonGraphicsToSimpleStyle(polygon: Cesium.PolygonGraphics) {
    const now = Cesium.JulianDate.now();
    const isFilled = polygon.fill;
    const material = polygon.material;
    const isOutlined = polygon.outline;
    const outlineColor = polygon.outlineColor;
    const outlineWidth = polygon.outlineWidth;
    let stroke: string;
    let strokeOpacity: number;
    let strokeWidth: number;
    let fill: string;
    let fillOpacity: number;

    if (isDefined(material) && isDefined(material.color)) {
        const color = material.color.getValue(now);
        fill = rgbToCssColor(color.red, color.green, color.blue);
        fillOpacity = color.alpha;
    } else {
        fill = SIMPLE_STYLE_DEFAULTS.fill;
        fillOpacity = SIMPLE_STYLE_DEFAULTS.fillOpacity;
    }
    if (isDefined(isFilled) && !isFilled.getValue(now)) {
        fillOpacity = 0;
    }

    if (isDefined(outlineColor)) {
        const colorValue = outlineColor.getValue(now);
        stroke = rgbToCssColor(colorValue.red, colorValue.green, colorValue.blue);
        strokeOpacity = colorValue.alpha;
    }
    if (isDefined(isOutlined) && !outlineColor.getValue(now)) {
        strokeOpacity = 0;
    }
    if (isDefined(outlineWidth)) {
        strokeWidth = outlineWidth.getValue(now);
    }

    return {
        fill,
        fillOpacity,
        stroke,
        strokeOpacity,
        strokeWidth
    };
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Geometry WKT

export function entityToGeometryWKT(selectedEntity: Cesium.Entity): string | null {

    if (selectedEntity.polyline) {
        const positions = selectedEntity.polyline.positions.getValue(Cesium.JulianDate.now());
        return `LINESTRING (${cartesian3ArrayToWKT(positions)})`;
    }

    if (selectedEntity.polygon) {
        const hierarchy = selectedEntity.polygon.hierarchy.getValue(Cesium.JulianDate.now());
        const positions = hierarchy.positions;
        const holes = hierarchy.holes;
        const exterieur = cartesian3ArrayToWKTArray(positions);
        if (exterieur.length > 2) {
            exterieur.push(exterieur[0]);
        }
        const linearRings = [`(${exterieur.join(', ')})`];
        if (holes && holes.length) {
            for (let hole of holes) {
                const interieur = cartesian3ArrayToWKTArray(hole.positions);
                if (interieur.length > 2) {
                    interieur.push(interieur[0]);
                }
                linearRings.push(`(${interieur.join(', ')})`);
            }
        }
        return `POLYGON (${linearRings.join(', ')})`;
    }

    if (selectedEntity.rectangle) {
        const coordinates = selectedEntity.rectangle.coordinates.getValue(Cesium.JulianDate.now());
        const x1 = toDeg(coordinates.west);
        const y1 = toDeg(coordinates.south);
        const x2 = toDeg(coordinates.east);
        const y2 = toDeg(coordinates.north);
        return `POLYGON ((${x1} ${y1}, ${x2} ${y1}, ${x2} ${y2}, ${x1} ${y2}, ${x1} ${y1}))`;
    }

    if (selectedEntity.position) {
        const position = selectedEntity.position.getValue(Cesium.JulianDate.now());
        return `POINT (${cartesian3ToWKT(position)})`
    }

    throw new TypeError("can't understand geometry of selected entity");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Helpers

export function getEntityByEntityId(viewer: Cesium.Viewer, entityId: string | number): Cesium.Entity | null {
    for (let i = 0; i < viewer.dataSources.length; i++) {
        const dataSource = viewer.dataSources.get(i);
        const entity = dataSource.entities.getById(entityId);
        if (entity) {
            return entity;
        }
    }
    return null;
}

function cartesian3ArrayToWKTArray(positions: Cesium.Cartesian3[]): string[] {
    return positions.map(p => cartesian3ToWKT(p));
}

function cartesian3ArrayToWKT(positions: Cesium.Cartesian3[]): string {
    return cartesian3ArrayToWKTArray(positions).join(', ');
}

function cartesian3ToWKT(position: Cesium.Cartesian3): string {
    const cartographic = Cesium.Cartographic.fromCartesian(position);
    return `${toDeg(cartographic.longitude)} ${toDeg(cartographic.latitude)}`;
}

function toDeg(x: number): number {
    return x * (180. / Math.PI);
}

function _getValue(key: string, predicate: (object: any) => boolean, objects: any[]) {
    for (let o of objects) {
        if (o) {
            const v = o[key];
            if (predicate(v)) {
                return v;
            }
        }
    }
}

function getNumber(key, ...objects) {
    return _getValue(key, isNumber, objects);
}

function getString(key, ...objects) {
    return _getValue(key, isString, objects);
}

