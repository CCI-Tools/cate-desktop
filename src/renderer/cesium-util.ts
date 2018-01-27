import {isDefined, isNumber, isString} from "../common/types";
import * as Cesium from "cesium";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SimpleStyle

/**
 * GeoJSON "standard" for styling geospatial data that can be shared across clients.
 * See https://github.com/mapbox/simplestyle-spec/tree/master/1.1.0
 */
export class SimpleStyle {
    // OPTIONAL: default ""
    // A title to show when this item is clicked or
    // hovered over
    title?: string;

    // OPTIONAL: default ""
    // A description to show when this item is clicked or
    // hovered over
    description?: string;

    // OPTIONAL: default "medium"
    // specify the size of the marker. sizes
    // can be different pixel sizes in different
    // implementations
    // Value must be one of
    // "small"
    // "medium"
    // "large"
    markerSize?: "small" | "medium" | "large";

    // OPTIONAL: default ""
    // a symbol to position in the center of this icon
    // if not provided or ""; no symbol is overlaid
    // and only the marker is shown
    // Allowed values include
    // - Icon ID
    // - An integer 0 through 9
    // - A lowercase character "a" through "z"
    markerSymbol?: string;

    // OPTIONAL: default "7e7e7e"
    // the marker's color
    //
    // value must follow COLOR RULES
    markerColor?: string;

    // OPTIONAL: default "555555"
    // the color of a line as part of a polygon; polyline; or
    // multigeometry
    //
    // value must follow COLOR RULES
    stroke?: string;

    // OPTIONAL: default 1.0
    // the opacity of the line component of a polygon; polyline; or
    // multigeometry
    //
    // value must be a floating point number greater than or equal to
    // zero and less or equal to than one
    strokeOpacity?: number;

    // OPTIONAL: default 2
    // the width of the line component of a polygon; polyline; or
    // multigeometry
    //
    // value must be a floating point number greater than or equal to 0
    strokeWidth?: number;

    // OPTIONAL: default "555555"
    // the color of the interior of a polygon
    //
    // value must follow COLOR RULES
    fill?: string;

    // OPTIONAL: default 0.6
    // the opacity of the interior of a polygon. Implementations
    // may choose to set this to 0 for line features.
    //
    // value must be a floating point number greater than or equal to
    // zero and less or equal to than one
    fillOpacity?: number;
}

/**
 * GeoJSON "standard" for styling geospatial data that can be shared across clients.
 * See https://github.com/mapbox/simplestyle-spec/tree/master/1.1.0
 */
export const SIMPLE_STYLE_DEFAULTS: SimpleStyle = {
    title: "",
    description: "",
    markerSize: "medium",
    markerSymbol: "",
    markerColor: "#7e7e7e",
    stroke: "#555555",
    strokeOpacity: 1,
    strokeWidth: 2,
    fill: "#555555",
    fillOpacity: 0.6
};

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

export function applyStyle(entity: Cesium.Entity, style: SimpleStyle): void {
    if (entity.point) {
        const point = entity.point;
        if (style.markerColor) {
            point.color = Cesium.Color.fromCssColorString(style.markerColor);
        }
        if (style.markerSize) {
            if (style.markerSize === "small") {
                point.pixelSize = 8;
            } else if (style.markerSize === "medium") {
                point.pixelSize = 16;
            } else {
                point.pixelSize = 32;
            }
        }
    } else if (entity.billboard) {
        const point = entity.point;
        if (style.markerSymbol) {
            point.image = style.markerSymbol;
        }
        if (style.markerColor) {
            point.color = Cesium.Color.fromCssColorString(style.markerColor);
        }
        if (style.markerSize) {
            if (style.markerSize === "small") {
                point.scale = 0.5;
            } else if (style.markerSize === "medium") {
                point.scale = 1.0;
            } else {
                point.scale = 2.0;
            }
        }
    } else if (entity.label) {
        const label = entity.label;
        if (isDefined(style.title)) {
            label.text = style.title;
        }
        if (isDefined(style.markerColor)) {
            label.color = Cesium.Color.fromCssColorString(style.markerColor);
        }
        if (isDefined(style.markerSize)) {
            if (style.markerSize === "small") {
                label.scale = 0.5;
            } else if (style.markerSize === "medium") {
                label.scale = 1.0;
            } else {
                label.scale = 2.0;
            }
        }
    } else if (entity.polyline) {
        const polyline = entity.polyline;
        if (isDefined(style.stroke)) {
            let alpha = 1.0;
            if (isDefined(style.strokeOpacity)) {
                alpha = 1.0 - style.strokeOpacity;
            }
            let color = Cesium.Color.fromCssColorString(style.stroke);
            if (alpha < 1) {
                color = color.withAlpha(alpha);
            }
            polyline.material = color;
        }
        if (isDefined(style.strokeWidth)) {
            polyline.width = style.strokeWidth;
        }
    } else if (entity.polygon) {
        const polygon = entity.polygon;

        if (isDefined(style.fill)) {
            let alpha = 1.0;
            if (isDefined(style.fillOpacity)) {
                alpha = 1.0 - style.fillOpacity;
            }
            let color = Cesium.Color.fromCssColorString(style.fill);
            if (alpha < 1) {
                color = color.withAlpha(alpha);
            }
            polygon.material = color;
        }

        if (isDefined(style.stroke)) {
            let alpha = 1.0;
            if (isDefined(style.strokeOpacity)) {
                alpha = 1.0 - style.strokeOpacity;
            }
            let color = Cesium.Color.fromCssColorString(style.stroke);
            if (alpha < 1) {
                color = color.withAlpha(alpha);
            }
            polygon.outlineColor = color;
        }

        if (isDefined(style.strokeWidth)) {
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
    const pixelSize = point.pixelSize;
    const color = point.color;
    let markerSize: "small" | "medium" | "large";
    let markerColor: string;
    let markerSymbol: string;
    if (isNumber(pixelSize)) {
        if (pixelSize < 10) {
            markerSize = "small";
        } else if (pixelSize < 20) {
            markerSize = "medium";
        } else {
            markerSize = "large";
        }
    }
    if (color) {
        markerColor = rgbToCssColor(color.red, color.green, color.blue);
    }
    return {
        markerSize,
        markerColor,
        markerSymbol,
    };
}

function billboardGraphicsToSimpleStyle(point: Cesium.BillboardGraphics) {
    const image = point.image;
    const scale = point.scale;
    const color = point.color;
    let markerSymbol: string;
    let markerSize: "small" | "medium" | "large";
    let markerColor: string;
    if (isString(image)) {
        markerSymbol = image;
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
    if (color) {
        markerColor = rgbToCssColor(color.red, color.green, color.blue);
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
    const width = polyline.width;
    const material = polyline.material;
    let stroke: string;
    let strokeOpacity: number;
    let strokeWidth: number;
    if (isNumber(width)) {
        strokeWidth = width;
    }
    if (material && material.color) {
        const color = material.color;
        stroke = rgbToCssColor(color.red, color.green, color.blue);
        strokeOpacity = 1 - color.alpha;
    }
    return {
        stroke,
        strokeOpacity,
        strokeWidth
    };
}

function polygonGraphicsToSimpleStyle(polygon: Cesium.PolygonGraphics) {
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

    if (material && material.color) {
        const color = material.color;
        fill = rgbToCssColor(color.red, color.green, color.blue);
        fillOpacity = 1 - color.alpha;
    } else {
        fill = SIMPLE_STYLE_DEFAULTS.fill;
        fillOpacity = SIMPLE_STYLE_DEFAULTS.fillOpacity;
    }
    if (isDefined(isFilled) && !isFilled) {
        fillOpacity = 0;
    }

    if (outlineColor) {
        stroke = rgbToCssColor(outlineColor.red, outlineColor.green, outlineColor.blue);
        strokeOpacity = 1 - outlineColor.alpha;
    }
    if (isDefined(isOutlined) && !isOutlined) {
        strokeOpacity = 0;
    }
    if (isNumber(outlineWidth)) {
        strokeWidth = outlineWidth;
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
