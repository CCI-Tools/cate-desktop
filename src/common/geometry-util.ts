export type GeometryType =
    'Point'
        | 'LineString'
        | 'Polygon'
        | 'Geometry'
        | 'MultiPoint'
        | 'MultiLineString'
        | 'MultiPolygon'
        | 'Gemetry'
        | 'GemetryCollection';

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

