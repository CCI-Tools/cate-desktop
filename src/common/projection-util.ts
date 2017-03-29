import * as proj4 from 'proj4';


function registerProjections() {
    // "EPSG:4326" should be already in proj4.defs
    // "EPSG:3857" should be already in proj4.defs
    proj4.defs('Glaciers_CCI_Greenland', "+title=Glacier CCI Greenland +proj=laea +datum=WGS84 +lon_0=-43 +lat_0=90 +x_0=0 +y_0=0 +units=m +no_defs");
    proj4.defs("EPSG:3411", "+title=NSIDC Sea Ice Polar Stereographic North +proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 +x_0=0 +y_0=0 +a=6378273 +b=6356889.449 +units=m +no_defs");
    proj4.defs("EPSG:3412", "+title=NSIDC Sea Ice Polar Stereographic South +proj=stere +lat_0=-90 +lat_ts=-70 +lon_0=0 +k=1 +x_0=0 +y_0=0 +a=6378273 +b=6356889.449 +units=m +no_defs");
    proj4.defs('EPSG:3413', "+title=WGS 84 / NSIDC Sea Ice Polar Stereographic North +proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs");
    proj4.defs("EPSG:3395", "+title=WGS 84 / World Mercator +proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs");
    proj4.defs("EPSG:3408", "+title=NSIDC EASE-Grid North +proj=laea +lat_0=90 +lon_0=0 +x_0=0 +y_0=0 +a=6371228 +b=6371228 +units=m +no_defs");
    proj4.defs("EPSG:3409", "+title=NSIDC EASE-Grid South +proj=laea +lat_0=-90 +lon_0=0 +x_0=0 +y_0=0 +a=6371228 +b=6371228 +units=m +no_defs");
    proj4.defs("EPSG:3410", "+title=NSIDC EASE-Grid Global +proj=cea +lon_0=0 +lat_ts=30 +x_0=0 +y_0=0 +a=6371228 +b=6371228 +units=m +no_defs");
}

registerProjections();

export interface Proj4CoordinatesObj {
    x: number;
    y: number;
    z?: number;
    m?: number;
}

export type Proj4Coordinates = number[] | Proj4CoordinatesObj;

export interface Proj4Projection {
    title: string;
    units: string;
    datum: string;
    b: number;
    rf: number;
    sphere: number;
    es: number;
    e: number;
    ep2: number;
    forward(coordinates: Proj4Coordinates): number[];
    inverse(coordinates: Proj4Coordinates): number[];
}

export function getProjectionCodes(): string[] {
    return Object.keys(proj4.defs);
}

export function getProjection(projectionCode: string): Proj4Projection|null|undefined {
    return proj4.defs(projectionCode);
}

export function validateProjectionCode(projectionCode: string) {
    if (!getProjection(projectionCode)) {
        throw new Error(`"${projectionCode}" is not a legal projection code.`);
    }
}
