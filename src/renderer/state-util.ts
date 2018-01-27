import {
    VariableState, VariableRefState, ResourceState, LayerState,
    VariableImageLayerState, OperationState, WorldViewDataState,
    TableViewDataState, FigureViewDataState, SavedLayers, VariableDataRefState, ResourceRefState,
    ResourceVectorLayerState, State
} from "./state";
import {ViewState} from "./components/ViewState";
import * as assert from "../common/assert";
import {isNumber, isString} from "../common/types";
import {EMPTY_ARRAY} from "./selectors";
import * as Cesium from "cesium";
import {GeometryWKTGetter} from "./containers/editor/ValueEditor";

export const SELECTED_VARIABLE_LAYER_ID = 'selectedVariable';
export const COUNTRIES_LAYER_ID = 'countries';


export function getTileUrl(baseUrl: string, baseDir: string, layer: VariableImageLayerState): string {
    return baseUrl + `ws/res/tile/${encodeURIComponent(baseDir)}/${layer.resId}/{z}/{y}/{x}.png?`
        + `&var=${encodeURIComponent(layer.varName)}`
        + `&index=${encodeURIComponent((layer.varIndex || []).join())}`
        + `&cmap=${encodeURIComponent(layer.colorMapName) + (layer.alphaBlending ? '_alpha' : '')}`
        + `&min=${encodeURIComponent(layer.displayMin + '')}`
        + `&max=${encodeURIComponent(layer.displayMax + '')}`;
}

export function getFeatureCollectionUrl(baseUrl: string, baseDir: string, ref: ResourceRefState): string {
    return baseUrl + `ws/res/geojson/${encodeURIComponent(baseDir)}/${ref.resId}`;
}

export function getFeatureUrl(baseUrl: string, baseDir: string, ref: ResourceRefState, index: number): string {
    return baseUrl + `ws/res/geojson/${encodeURIComponent(baseDir)}/${ref.resId}/${index}`;
}

export function getCsvUrl(baseUrl: string, baseDir: string, ref: ResourceRefState, varName?: string | null): string {
    let varPart = '';
    if (varName) {
        varPart = `?var=${encodeURIComponent(varName)}`;
    }
    return baseUrl + `ws/res/csv/${encodeURIComponent(baseDir)}/${ref.resId}${varPart}`;
}

export function getGeoJSONCountriesUrl(baseUrl: string): string {
    return baseUrl + 'ws/countries';
}

export function getMPLWebSocketUrl(baseUrl: string, baseDir: string, figureId: number): string {
    return `${baseUrl}${encodeURIComponent(baseDir)}/${encodeURIComponent('' + figureId)}`;
}

export function getMPLDownloadUrl(baseUrl: string, baseDir: string, figureId: number): string {
    return `${baseUrl}mpl/download/${encodeURIComponent(baseDir)}/${encodeURIComponent('' + figureId)}`;
}

export function isSpatialImageVariable(variable: VariableState): boolean {
    return variable.numDims && variable.numDims >= 2 && !!variable.imageLayout;
}

export function isSpatialVectorVariable(variable: VariableState): boolean {
    return variable.isFeatureAttribute;
}

export function genSimpleId(prefix: string): string {
    return prefix + Math.floor((1 + Math.random()) * 0x100000000).toString(16) + '-' + Math.floor(Date.now()).toString(16);
}

export function genLayerId() {
    return genSimpleId('layer-');
}

export function genPlacemarkId() {
    return genSimpleId('placemark-');
}

export function isFigureResource(resource: ResourceState | null): boolean {
    return resource && isNumber(resource.id) && resource.dataType.endsWith('.Figure');
}

export function isDataFrameResource(resource: ResourceState | null): boolean {
    return resource && (resource.dataType.endsWith('.DataFrame') || resource.dataType.endsWith('.GeoDataFrame'));
}

export function isSeriesResource(resource: ResourceState | null): boolean {
    return resource && (resource.dataType.endsWith('.Series') || resource.dataType.endsWith('.GeoSeries'));
}

export function getLayerDisplayName(layer: LayerState): string {
    if (layer.name) {
        return layer.name;
    }
    const varName = (layer as any).varName;
    const resName = (layer as any).resName;
    if (layer.id === SELECTED_VARIABLE_LAYER_ID) {
        if (resName && varName) {
            return `Selected Variable (${resName} / ${varName})`;
        }
        return `Selected Variable (none)`;
    } else {
        if (resName && varName) {
            return `${resName} / ${varName}`;
        }
    }
    return layer.id;
}

export function getLayerTypeIconName(layer: LayerState): string {
    if (layer.type == "Vector" || layer.type === "ResourceVector") {
        return "pt-icon-map-marker";
    } else if (layer.type == "Image" || layer.type === "VariableImage") {
        return "pt-icon-layout-grid"; // "pt-icon-helper-management" also good
    }
    return "pt-icon-layer";
}

export function findResource(resources: ResourceState[], ref: ResourceRefState): ResourceState | null {
    return findResourceById(resources, ref.resId);
}

export function findResourceByName(resources: ResourceState[], name: string): ResourceState | null {
    return resources.find(r => r.name === name);
}

export function findResourceById(resources: ResourceState[], id: number): ResourceState | null {
    return resources.find(r => r.id === id);
}

export function findVariable(resources: ResourceState[], ref: VariableRefState): VariableState | null {
    const resource = findResource(resources, ref);
    return resource && resource.variables && resource.variables.find(v => v.name === ref.varName);
}

export function findOperation(operations: OperationState[], name: string): OperationState | null {
    return operations && operations.find(op => op.qualifiedName === name || op.name === name);
}

export function findVariableIndexCoordinates(resources: ResourceState[], ref: VariableDataRefState): any[] {
    const resource = findResourceById(resources, ref.resId);
    if (!resource) {
        return EMPTY_ARRAY;
    }
    const coordVariables = resource.coordVariables;
    if (!coordVariables) {
        return EMPTY_ARRAY;
    }
    const variable = resource && resource.variables.find(v => v.name === ref.varName);
    if (!variable) {
        return EMPTY_ARRAY;
    }
    const varIndex = ref.varIndex;
    if (!varIndex || !varIndex.length) {
        return EMPTY_ARRAY;
    }
    const dimNames = variable.dimNames;
    if (!dimNames || !dimNames.length) {
        return EMPTY_ARRAY;
    }

    const coordDataMap = {};
    coordVariables.forEach(cv => {
        coordDataMap[cv.name] = cv.data;
    });

    let coords = [];
    for (let i = 0; i < varIndex.length; i++) {
        const coordIndex = varIndex[i];
        const dimName = i < dimNames.length ? dimNames[i] : null;
        let coord;
        if (dimName) {
            const coordData = coordDataMap[dimName];
            if (coordData && coordData.length && coordIndex < coordData.length) {
                coord = coordData[coordIndex];
            } else {
                coord = '-';
            }
        } else {
            coord = '?';
        }
        coords.push([dimName, coord]);
    }
    return coords;
}


function newInitialWorldViewData(): WorldViewDataState {
    return {
        viewMode: "3D",
        projectionCode: 'EPSG:4326',
        layers: [
            {
                id: SELECTED_VARIABLE_LAYER_ID,
                type: 'Unknown',
                visible: true,
            },
            {
                id: COUNTRIES_LAYER_ID,
                name: 'Countries',
                type: 'Vector',
                visible: false,
            }
        ],
        selectedLayerId: SELECTED_VARIABLE_LAYER_ID,
        isSelectedLayerSplit: null,
        selectedLayerSplitPos: 0.5,
    } as WorldViewDataState;
}

function newInitialFigureViewData(resourceId: number): FigureViewDataState {
    return {
        resourceId: resourceId,
        fixedSize: false,
    };
}

function newInitialTableViewData(resName: string, varName: string): TableViewDataState {
    return {resName, varName, dataRows: null};
}

let WORLD_VIEW_COUNTER = 0;

export function newWorldView(): ViewState<WorldViewDataState> {
    const viewNumber = ++WORLD_VIEW_COUNTER;
    return {
        title: `World (${viewNumber})`,
        id: genSimpleId('world-'),
        type: 'world',
        iconName: "pt-icon-globe",
        data: newInitialWorldViewData(),
    };
}


export function newFigureView(resource: ResourceState): ViewState<FigureViewDataState> {
    return {
        title: getFigureViewTitle(resource.name),
        id: `fig-${resource.id}`,
        type: 'figure',
        iconName: "pt-icon-timeline-area-chart",
        data: newInitialFigureViewData(resource.id),
    };
}

export function getFigureViewTitle(resourceName: string): string {
    return `Figure - ${resourceName}`;
}


export function newTableView(resName: string, varName: string): ViewState<TableViewDataState> {
    return {
        title: varName ? `${resName}.${varName}` : resName,
        id: genSimpleId('table-'),
        type: 'table',
        iconName: "pt-icon-th",
        data: newInitialTableViewData(resName, varName),
    };
}

/**
 * An object that is used by CesiumGlobe to store the Cesium.Viewer instances.
 * It can't be a part of our global state object.
 */
export const EXTERNAL_OBJECT_STORE = {id: "global_external_object_store"};

export function getWorldViewSelectedEntity(view: ViewState<any>): Cesium.Entity | null {
    if (view && view.type === 'world') {
        const externalObject = EXTERNAL_OBJECT_STORE["CesiumGlobe-" + view.id];
        if (externalObject) {
            const cesiumViewer: Cesium.Viewer = externalObject.object;
            if (cesiumViewer) {
                return cesiumViewer.selectedEntity;
            }
        }
    }
    return null;
}

export function getWorldViewSelectedGeometryWKTGetter(view: ViewState<any>): GeometryWKTGetter {
    const selectedEntity = getWorldViewSelectedEntity(view);
    if (selectedEntity) {
        return () => entityToGeometryWKT(selectedEntity);
    }
    return null;
}

export function newVariableLayer(resource: ResourceState,
                                 variable: VariableState,
                                 savedLayers?: { [name: string]: LayerState }): LayerState {
    assert.ok(resource);
    assert.ok(variable);
    const spatialImageVariable = variable && isSpatialImageVariable(variable);
    const spatialVectorVariable = variable && isSpatialVectorVariable(variable);
    assert.ok(spatialImageVariable || spatialVectorVariable, 'geo-spatial variable expected');
    if (spatialImageVariable) {
        const restoredLayer = (savedLayers && savedLayers[variable.name]) as VariableImageLayerState;
        const layerDisplayProperties = updateVariableLayerVarIndex(variable, restoredLayer);
        return {
            ...restoredLayer,
            id: genLayerId(),
            type: 'VariableImage',
            name: `${resource.name}.${variable.name}`,
            visible: true,
            resId: resource.id,
            resName: resource.name,
            varName: variable.name,
            ...layerDisplayProperties
        } as VariableImageLayerState;
    } else {
        const restoredLayer = (savedLayers && savedLayers[variable.name]) as ResourceVectorLayerState;
        return {
            ...restoredLayer,
            id: genLayerId(),
            type: 'ResourceVector',
            name: `${resource.name}`,
            visible: true,
            resId: resource.id,
            resName: resource.name,
        } as ResourceVectorLayerState;
    }
}

export function updateSelectedVariableLayer(selectedLayer: LayerState,
                                            resource: ResourceState,
                                            variable: VariableState,
                                            savedLayers?: SavedLayers): LayerState {
    assert.ok(selectedLayer);
    assert.ok(selectedLayer.id === SELECTED_VARIABLE_LAYER_ID);
    const spatialImageVariable = variable && isSpatialImageVariable(variable);
    const spatialVectorVariable = variable && isSpatialVectorVariable(variable);
    if (spatialImageVariable) {
        const restoredLayer = (savedLayers && savedLayers[variable.name]) as VariableImageLayerState;
        const layerDisplayProperties = updateVariableLayerVarIndex(variable, restoredLayer);
        // console.log("updateSelectedVariableLayer: ", variable.name, savedLayers, restoredLayer, layerDisplayProperties);
        return {
            ...selectedLayer,
            ...restoredLayer,
            type: 'VariableImage',
            name: `Variable: ${resource.name}.${variable.name}`,
            resId: resource.id,
            resName: resource.name,
            varName: variable.name,
            ...layerDisplayProperties
        };
    } else if (spatialVectorVariable) {
        const restoredLayer = (savedLayers && savedLayers[resource.name]) as ResourceVectorLayerState;
        return {
            ...selectedLayer,
            ...restoredLayer,
            type: 'ResourceVector',
            name: `Resource: ${resource.name}`,
            resId: resource.id,
            resName: resource.name
        } as ResourceVectorLayerState;
    } else {
        return {
            id: SELECTED_VARIABLE_LAYER_ID,
            type: 'Unknown' as any,
            name: variable ? `Variable: ${variable.name} (not geo-spatial)` : '(no selection)',
            visible: selectedLayer.visible,
        } as any;
    }
}

export function getLockForLoadDataSources(dataStoreId: string) {
    return `loadDataSources("${dataStoreId}")`;
}

export function getLockForGetWorkspaceVariableStatistics(resName: string, varName: string, varIndex?: number[]) {
    return getVariableLock('getWorkspaceVariableStatistics', resName, varName, varIndex);
}

function getVariableLock(op: string, resName: string, varName: string, varIndex: number[]) {
    if (varIndex && varIndex.length) {
        return `${op}("${resName}", "${varName}", [${varIndex}])`;
    } else {
        return `${op}("${resName}", "${varName}")`;
    }
}

/**
 * If there is a restoredLayer try reusing its varIndex, otherwise generate new variable display properties with
 * new varIndex.
 *
 * @param variable
 * @param restoredLayer
 * @returns {{varIndex: any}}
 */
function updateVariableLayerVarIndex(variable: VariableState | null,
                                     restoredLayer: VariableImageLayerState | null) {
    let layerDisplayProperties;
    let varIndex;
    if (restoredLayer) {
        varIndex = restoredLayer.varIndex && restoredLayer.varIndex.slice();
    } else if (variable) {
        layerDisplayProperties = newVariableLayerDisplayProperties(variable);
    }
    if (variable) {
        varIndex = newVarIndex(variable, varIndex);
    }
    return {...layerDisplayProperties, varIndex};
}

function newVarIndex(variable: VariableState, varIndex) {
    const numSpatialDims = 2;
    if (variable.numDims
        && variable.numDims >= numSpatialDims
        && (!varIndex || varIndex.length != variable.numDims - numSpatialDims)) {
        return Array(variable.numDims - numSpatialDims).fill(0);
    }
    return varIndex;
}


function newVariableLayerDisplayProperties(variable: VariableState) {
    const defaultColorMapName = 'inferno';
    const defaultDisplayMin = isNumber(variable.validMin) ? variable.validMin : 0.;
    const defaultDisplayMax = isNumber(variable.validMax) ? variable.validMax : defaultDisplayMin + 1.;
    return {
        colorMapName: isString(variable.colorMapName) ? variable.colorMapName : defaultColorMapName,
        displayMin: isNumber(variable.displayMin) ? variable.displayMin : defaultDisplayMin,
        displayMax: isNumber(variable.displayMax) ? variable.displayMax : defaultDisplayMax,
        alphaBlending: false,
        opacity: 1.0,
        brightness: 1.0,
        contrast: 1.0,
        hue: 0.0,
        saturation: 1.0,
        gamma: 1.0,
    };
}

// from https://stackoverflow.com/questions/11871077/proper-way-to-detect-webgl-support
export function hasWebGL(): boolean {
    let canvas;
    let context;
    let extensions;

    try {
        canvas = document.createElement('canvas');
        context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        extensions = context.getSupportedExtensions();
        console.log("WebGL supported extensions:", extensions);
    } catch (e) {
        console.warn("WebGL not supported but required by world view");
        return false;
    }

    canvas = null;
    context = null;
    return true;
}

export function entityToGeometryWKT(selectedEntity: Cesium.Entity): string {

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
