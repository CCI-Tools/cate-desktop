import * as React from 'react';
import {ModalDialog} from "./ModalDialog";

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

interface IGeometryInputDialogProps {
    isOpen: boolean;
    value: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
    geometryType: GeometryType;
}

interface IGeometryInputDialogState {
    value?: string;
    error?: Error;
}

export class GeometryInputDialog extends React.Component<IGeometryInputDialogProps, IGeometryInputDialogState> {
    static readonly NOMINAL_CLASS = "pt-input pt-fill";
    static readonly ERROR_CLASS = "pt-input pt-fill pt-intent-danger";

    constructor(props: IGeometryInputDialogProps, context: any) {
        super(props, context);
        this.renderBody = this.renderBody.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.canConfirm = this.canConfirm.bind(this);
        this.onChange = this.onChange.bind(this);
        this.state = this.toState(this.props.value);
    }

    onConfirm() {
        this.props.onConfirm(this.state.value);
    }

    onChange(ev: any) {
        this.setState(this.toState(ev.target.value));
    }

    canConfirm(): boolean {
        return !this.state.error;
    }

    private toState(value: any) {
        let error;
        try {
            validateWKTGeometryType(value, this.props.geometryType);
        } catch (e) {
            error = e;
        }
        return {value, error};
    }

    render() {
        return (
            <ModalDialog isOpen={this.props.isOpen}
                         title="Geometry Editor"
                         onCancel={this.props.onCancel}
                         onConfirm={this.onConfirm}
                         canConfirm={this.canConfirm}
                         renderBody={this.renderBody}/>
        );
    }

    renderBody() {
        const value = this.state.value;
        const hasError = !!this.state.error;
        return (
            <div className="pt-form-group">
                <label className="pt-label" htmlFor="wkt">
                    {`Enter Geometry of type ${this.props.geometryType}`}
                    <span className="pt-text-muted"> (WGS84 coordinates in degree)</span>
                </label>
                <div className="pt-form-content" style={{width: "100%"}}>
                    <textarea id="wkt"
                              className={hasError ? GeometryInputDialog.ERROR_CLASS : GeometryInputDialog.NOMINAL_CLASS}
                              rows={10}
                              dir="auto"
                              value={value}
                              onChange={this.onChange}/>
                    {this.getHelpText()}
                </div>
            </div>
        );
    }

    getHelpText() {
        let errorText;
        if (this.state.error) {
            errorText = (<p>{`Error: ${this.state.error.message}`}</p>);
        }

        let helpText;
        if (this.props.geometryType === 'Point') {
            helpText = (<p>Use <code>lon, lat</code> or use {this.props.geometryType} {WKT_LINK} syntax.</p>);
        }
        else if (this.props.geometryType === 'Polygon') {
            helpText = (
                <p>Use <code>west, south, east, north</code> or use {this.props.geometryType} {WKT_LINK} syntax.</p>);
        } else {
            helpText = (<p>Use {this.props.geometryType} {WKT_LINK} syntax.</p>);
        }

        return (<div className="pt-form-helper-text">{errorText}{helpText}</div>);
    }
}

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
console.log('WKT_GEOMETRIES_TEXT:', WKT_GEOMETRIES_TEXT);

const WKT_LINK = (<a href="https://en.wikipedia.org/wiki/Well-known_text">Well-Known Text (WKT)</a>);

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
    }  else if (geometryType === 'MULTIPOINT') {
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
