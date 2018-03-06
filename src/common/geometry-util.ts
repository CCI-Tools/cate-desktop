import {DirectGeometryObject, Feature, GeoJsonObject, Position} from "geojson";
import * as Cesium from "cesium";

export type GeometryType =
    'Point'
    | 'LineString'
    | 'Polygon'
    | 'Geometry'
    | 'MultiPoint'
    | 'MultiLineString'
    | 'MultiPolygon'
    | 'Geometry'
    | 'GeometryCollection';

const WKT_GEOMETRY_TYPES = new Set([
                                       'POINT',
                                       'LINESTRING',
                                       'POLYGON',
                                       'MULTIPOINT',
                                       'MULTILINESTRING',
                                       'MULTIPOLYGON',
                                       'GEOMETRYCOLLECTION',
                                   ]);

const WKT_GEOMETRIES_TEXT = new Array(WKT_GEOMETRY_TYPES.values()).map(s => `"${s}"`).join(', ');

function isAlpha(c: string) {
    return c >= 'A' && c <= 'Z' || c >= 'a' && c <= 'z';
}

function parseFloatWithError(textValue: string, errorText?: string) {
    const value = parseFloat(textValue);
    if (isNaN(value) && textValue.toLowerCase() !== 'nan') {
        throw new Error(errorText || 'Value must be a number.');
    }
    return value;
}

export function validateGeometryValue(value: string, geometryType: GeometryType) {
    if (!value) {
        return;
    }
    value = value.trim();
    if (value === '') {
        return;
    }

    let isWKT = false;
    if (isAlpha(value)) {
        isWKT = true;
        // Quick and dirty WKT validation
        let i = 1;
        for (; i < value.length && isAlpha(value[i]); i++) {
        }

        const geometryName = value.substr(0, i).toUpperCase();
        value = value.substr(i);

        validateWKTGeometryType(geometryName, geometryType);
        validateWKTBody(value, geometryName);
    }

    let coordParts = value.split(/[\s,()]+/);
    let i1;
    let i2;
    if (coordParts.length && coordParts[0] === '') {
        i1 = 1;
    }
    if (coordParts.length && coordParts[coordParts.length - 1] === '') {
        i2 = coordParts.length - 1;
    }

    if (i1 > 0 && i2 > 0) {
        coordParts = coordParts.slice(i1, i2);
    } else if (i1 > 0) {
        coordParts = coordParts.slice(i1);
    } else if (i2 > 0) {
        coordParts = coordParts.slice(0, i2);
    }
    if (coordParts.length % 2 !== 0) {
        throw new Error('Illegal number of coordinates.');
    }
    if (!isWKT) {
        if (geometryType === 'Point') {
            if (coordParts.length !== 2) {
                throw new Error('Point must have "<Longitude>, <Latitude>" syntax.');
            }
        } else if (geometryType === 'Polygon') {
            if (coordParts.length !== 4) {
                throw new Error('Bounding box must have "<E>, <S>, <W>, <N>" syntax.');
            }
        } else {
            throw new Error('Invalid WKT.');
        }
    }
    for (let i = 0; i < coordParts.length; i += 2) {
        const lon = parseFloatWithError(coordParts[i], 'Longitude value must be a number.');
        const lat = parseFloatWithError(coordParts[i + 1], 'Latitude value must be a number.');
        validateGeoCoordinate(lon, lat);
    }
}

function validateWKTGeometryType(value: string, geometryType: GeometryType) {
    const geometryTypeUC = geometryType.toUpperCase();

    if (geometryType === 'Geometry') {
        if (!WKT_GEOMETRY_TYPES.has(value)) {
            throw new Error(`${geometryType} WKT must start with one of ${WKT_GEOMETRIES_TEXT}.`)
        }
    } else {
        if (!value.startsWith(geometryTypeUC)) {
            throw new Error(`${geometryType} WKT must start with "${geometryTypeUC}".`)
        }
    }
}

function validateWKTBody(value: string, geometryType: string) {
    let expectedMinCommaCount;
    let expectedMinDepthCount;
    let expectedMaxDepthCount;
    if (geometryType === 'POINT') {
        expectedMinCommaCount = 0;
        expectedMinDepthCount = 1;
        expectedMaxDepthCount = 1;
    } else if (geometryType === 'LINESTRING') {
        expectedMinCommaCount = 1;
        expectedMinDepthCount = 1;
        expectedMaxDepthCount = 1;
    } else if (geometryType === 'POLYGON') {
        expectedMinCommaCount = 3;
        expectedMinDepthCount = 2;
        expectedMaxDepthCount = 2;
    } else if (geometryType === 'MULTIPOINT') {
        expectedMinCommaCount = 1;
        expectedMinDepthCount = 1;
        expectedMaxDepthCount = 2;
    } else if (geometryType === 'MULTILINESTRING') {
        expectedMinCommaCount = 1;
        expectedMinDepthCount = 2;
        expectedMaxDepthCount = 2;
    } else if (geometryType === 'MULTIPOLYGON') {
        expectedMinCommaCount = 3;
        expectedMinDepthCount = 3;
        expectedMaxDepthCount = 3;
    } else if (geometryType === 'GEOMETRYCOLLECTION') {
        expectedMinCommaCount = 0;
        expectedMinDepthCount = 1;
        expectedMaxDepthCount = 3;
    }
    let commaCount = 0;
    let depthCount = 0;
    let maxDepthCount = 0;
    for (let i = 0; i < value.length; i++) {
        let c = value[i];
        if (c === '(') {
            depthCount++;
            if (depthCount > expectedMaxDepthCount) {
                throw new Error('Invalid WKT, too many "(".');
            }
            maxDepthCount = Math.max(maxDepthCount, depthCount);
        }
        else if (c === ')') {
            depthCount--;
            if (depthCount < 0) {
                throw new Error('Invalid WKT, too many ")".');
            }
            if (depthCount === 0) {
                if (commaCount < expectedMinCommaCount) {
                    throw new Error('Invalid WKT, too few coordinates.');
                }
                commaCount = 0;
            }
        }
        else if (c === ',') {
            commaCount++;
        }
    }
    if (depthCount !== 0) {
        throw new Error('Invalid WKT, too many "(".');
    }
    if (maxDepthCount < expectedMinDepthCount) {
        throw new Error('Invalid WKT, too few "(".');
    }
}

export function validateGeoCoordinate(lon: number, lat: number) {
    if (lon < -180 || lon > 180) {
        throw new Error('Longitude must be in the range -180 to +180 degrees.');
    }
    if (lat < -90 || lat > 90) {
        throw new Error('Latitude must be in the range -90 to +90 degrees.');
    }
}

export function isBox(geometry: DirectGeometryObject) {
    if (geometry.type === "Polygon" && geometry.coordinates.length === 1) {
        const positions = geometry.coordinates[0] as Position[];
        if (positions.length == 5) {
            const x0 = positions[0][0];
            const y0 = positions[0][1];
            const x1 = positions[1][0];
            const y1 = positions[1][1];
            const x2 = positions[2][0];
            const y2 = positions[2][1];
            const x3 = positions[3][0];
            const y3 = positions[3][1];
            const x4 = positions[4][0];
            const y4 = positions[4][1];
            const dx1 = x1 - x0;
            const dy1 = y1 - y0;
            const dx2 = x2 - x1;
            const dy2 = y2 - y1;
            const dx3 = x3 - x2;
            const dy3 = y3 - y2;
            const dx4 = x4 - x3;
            const dy4 = y4 - y3;
            return dx1 === 0.0 && dy2 === 0 && dx3 === 0.0 && dy4 === 0
                   || dy1 === 0 && dx2 === 0.0 && dy3 === 0 && dx4 === 0.0;
        }
    }
    return false;
}

export function geometryGeoJsonToCsv(geometry: DirectGeometryObject, sep?: string) {
    sep = sep || ",";
    const header = `longitude${sep}latitude\n`;
    if (geometry.type === "Point") {
        const position = geometry.coordinates;
        return `${header}${position[0]}${sep}${position[1]}\n`;
    } else if (geometry.type === "LineString") {
        const coordinates = geometry.coordinates;
        let a = [];
        for (let position of coordinates) {
            a.push(`${position[0]}${sep}${position[1]}\n`)
        }
        return `${header}${a.join('')}`;
    } else if (geometry.type === "Polygon") {
        const coordinates = geometry.coordinates;
        let a = [];
        for (let ring of coordinates) {
            if (a.length > 0) {
                a.push(`# hole:\n`)
            }
            for (let position of ring as any) {
                a.push(`${position[0]}${sep}${position[1]}\n`)
            }
        }
        return `${header}${a.join('')}`;
    }
    return "";
}

export function geometryGeoJsonToGeometryWkt(geometry: DirectGeometryObject): string {

    if (geometry.type === "Point") {
        const position = geometry.coordinates;
        return `POINT (${position[0]} ${position[1]})`
    } else if (geometry.type === "LineString") {
        const coordinates = geometry.coordinates;
        let a = [];
        for (let position of coordinates) {
            a.push(`${position[0]} ${position[1]}`)
        }
        return `LINESTRING (${a.join(', ')})`;
    } else if (geometry.type === "Polygon") {
        const coordinates = geometry.coordinates;
        let a1 = [];
        for (let ring of coordinates) {
            let a2 = [];
            for (let position of ring as any) {
                a2.push(`${position[0]} ${position[1]}`)
            }
            a1.push(`(${a2.join(', ')})`)
        }
        return `POLYGON (${a1.join(', ')})`;
    }
    return "";
}


export function geoJsonToText(geoJson: GeoJsonObject) {
    return JSON.stringify(geoJson, null, 2);
}
