import { isDefined } from './types';

/**
 * GeoJSON "standard" for styling geospatial data that can be shared across clients.
 * See https://github.com/mapbox/simplestyle-spec/tree/master/1.1.0
 */
export interface SimpleStyle {
    // OPTIONAL: default ""
    // A title to show when this item is clicked or
    // hovered over
    readonly title?: string;

    // OPTIONAL: default ""
    // A description to show when this item is clicked or
    // hovered over
    readonly description?: string;

    // OPTIONAL: default "medium"
    // specify the size of the marker. sizes
    // can be different pixel sizes in different
    // implementations
    // Value must be one of
    // "small"
    // "medium"
    // "large"
    readonly markerSize?: 'small' | 'medium' | 'large';

    // OPTIONAL: default ""
    // a symbol to position in the center of this icon
    // if not provided or ""; no symbol is overlaid
    // and only the marker is shown
    // Allowed values include
    // - Icon ID
    // - An integer 0 through 9
    // - A lowercase character "a" through "z"
    readonly markerSymbol?: string;

    // OPTIONAL: default "7e7e7e"
    // the marker's color
    //
    // value must follow COLOR RULES
    readonly markerColor?: string;

    // OPTIONAL: default "555555"
    // the color of a line as part of a polygon; polyline; or
    // multigeometry
    //
    // value must follow COLOR RULES
    readonly stroke?: string;

    // OPTIONAL: default 1.0
    // the opacity of the line component of a polygon; polyline; or
    // multigeometry
    //
    // value must be a floating point number greater than or equal to
    // zero and less or equal to than one
    readonly strokeOpacity?: number;

    // OPTIONAL: default 2
    // the width of the line component of a polygon; polyline; or
    // multigeometry
    //
    // value must be a floating point number greater than or equal to 0
    readonly strokeWidth?: number;

    // OPTIONAL: default "555555"
    // the color of the interior of a polygon
    //
    // value must follow COLOR RULES
    readonly fill?: string;

    // OPTIONAL: default 0.6
    // the opacity of the interior of a polygon. Implementations
    // may choose to set this to 0 for line features.
    //
    // value must be a floating point number greater than or equal to
    // zero and less or equal to than one
    readonly fillOpacity?: number;
}

/**
 * GeoJSON "standard" for styling geospatial data that can be shared across clients.
 * See https://github.com/mapbox/simplestyle-spec/tree/master/1.1.0
 */
export const SIMPLE_STYLE_DEFAULTS: SimpleStyle = {
    title: '',
    description: '',
    markerSize: 'medium',
    markerSymbol: '',
    markerColor: '#7e7e7e',
    stroke: '#555555',
    strokeOpacity: 1,
    strokeWidth: 2,
    fill: '#555555',
    fillOpacity: 0.6
};

export function simpleStyleFromFeatureProperties(properties: any): SimpleStyle {
    const styleProperties = {
        title: properties['title'],
        description: properties['description'],
        markerSymbol: properties['marker-symbol'],
        markerSize: properties['marker-size'],
        markerColor: properties['marker-color'],
        stroke: properties['stroke'],
        strokeOpacity: properties['stroke-opacity'],
        strokeWidth: properties['stroke-width'],
        fill: properties['fill'],
        fillOpacity: properties['fill-opacity'],
    };

    const simpleStyle = {};
    for (let p of Object.getOwnPropertyNames(styleProperties)) {
        if (isDefined(styleProperties[p])) {
            simpleStyle[p] = styleProperties[p];
        }
    }

    return simpleStyle;
}

export function featurePropertiesFromSimpleStyle(style: SimpleStyle): any {
    const styleProperties = {
        'title': style.title,
        'description': style.description,
        'marker-symbol': style.markerSymbol,
        'marker-size': style.markerSize,
        'marker-color': style.markerColor,
        'stroke': style.stroke,
        'stroke-opacity': style.strokeOpacity,
        'stroke-width': style.strokeWidth,
        'fill': style.fill,
        'fill-opacity': style.fillOpacity,
    };

    const properties = {};
    for (let p of Object.getOwnPropertyNames(styleProperties)) {
        if (isDefined(styleProperties[p])) {
            properties[p] = styleProperties[p];
        }
    }

    return properties;
}
