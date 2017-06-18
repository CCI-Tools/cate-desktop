import {
    VariableState, VariableRefState, ResourceState, LayerState, VariableVectorLayerState,
    VariableImageLayerState, OperationState, WorldViewDataState,
    TableViewDataState, FigureViewDataState, SavedLayers
} from "./state";
import {ViewState} from "./components/ViewState";
import * as assert from "../common/assert";
import {isNumber} from "../common/types";

export const SELECTED_VARIABLE_LAYER_ID = 'selectedVariable';
export const COUNTRIES_LAYER_ID = 'countries';


export function getTileUrl(baseUrl: string, baseDir: string, layer: VariableImageLayerState): string {
    return baseUrl + `ws/res/tile/${encodeURIComponent(baseDir)}/${encodeURIComponent(layer.resName)}/{z}/{y}/{x}.png?`
        + `&var=${encodeURIComponent(layer.varName)}`
        + `&index=${encodeURIComponent((layer.varIndex || []).join())}`
        + `&cmap=${encodeURIComponent(layer.colorMapName) + (layer.alphaBlending ? '_alpha' : '')}`
        + `&min=${encodeURIComponent(layer.displayMin + '')}`
        + `&max=${encodeURIComponent(layer.displayMax + '')}`;
}

export function getGeoJSONUrl(baseUrl: string, baseDir: string, layer: VariableVectorLayerState): string {
    return baseUrl + `ws/res/geojson/${encodeURIComponent(baseDir)}/${encodeURIComponent(layer.resName)}/8?`
        + `&var=${encodeURIComponent(layer.varName)}`
        + `&index=${encodeURIComponent((layer.varIndex || []).join())}`
        + `&cmap=${encodeURIComponent(layer.colorMapName)}`
        + `&min=${encodeURIComponent(layer.displayMin + '')}`
        + `&max=${encodeURIComponent(layer.displayMax + '')}`;
}

export function getCsvUrl(baseUrl: string, baseDir: string, resName: string, varName?: string | null): string {
    let varPart = '';
    if (varName) {
        varPart = `?var=${encodeURIComponent(varName)}`;
    }
    return baseUrl + `ws/res/csv/${encodeURIComponent(baseDir)}/${encodeURIComponent(resName)}${varPart}`;
}

export function getGeoJSONCountriesUrl(baseUrl: string): string {
    return baseUrl + 'ws/countries/0';
}

export function getMPLWebSocketUrl(baseUrl: string, baseDir: string, figureId: number): string {
    return `${baseUrl}${encodeURIComponent(baseDir)}/${encodeURIComponent('' + figureId)}`;
}

export function getMPLDownloadUrl(baseUrl: string, baseDir: string, figureId: number): string {
    return `${baseUrl}mpl/download/${encodeURIComponent(baseDir)}/${encodeURIComponent('' + figureId)}`;
}

export function isSpatialImageVariable(variable: VariableState): boolean {
    return variable.ndim && variable.ndim >= 2 && !!variable.imageLayout;
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

export function findResource(resources: ResourceState[], ref: VariableRefState): ResourceState | null {
    return resources.find(r => r.name === ref.resName);
}

export function findVariable(resources: ResourceState[], ref: VariableRefState): VariableState | null {
    const resource = findResource(resources, ref);
    return resource && resource.variables && resource.variables.find(v => v.name === ref.varName);
}

export function findOperation(operations: OperationState[], name: string): OperationState | null {
    return operations && operations.find(op => op.qualifiedName === name || op.name === name);
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
    } as WorldViewDataState;
}

function newInitialFigureViewData(resourceId: number): FigureViewDataState {
    return {
        resourceId: resourceId,
        fixedSize: false,
    };
}

function newInitialTableViewData(resName: string | null, varName: string | null): TableViewDataState {
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
        title:getFigureViewTitle(resource.name),
        id: `fig-${resource.id}`,
        type: 'figure',
        iconName: "pt-icon-timeline-area-chart",
        data: newInitialFigureViewData(resource.id),
    };
}

export function getFigureViewTitle(resourceName: string): string {
    return `Figure - ${resourceName}`;
}

let TABLE_VIEW_COUNTER = 0;

export function newTableView(resName: string | null, varName: string | null): ViewState<TableViewDataState> {
    const viewNumber = ++TABLE_VIEW_COUNTER;
    return {
        title: `Table (${viewNumber})`,
        id: genSimpleId('table-'),
        type: 'table',
        iconName: "pt-icon-th",
        data: newInitialTableViewData(resName, varName),
    };
}

export function newVariableLayer(resource: ResourceState,
                                 variable: VariableState,
                                 savedLayers?: { [name: string]: LayerState }): LayerState {
    assert.ok(resource);
    assert.ok(variable);
    const spatialImageVariable = variable && isSpatialImageVariable(variable);
    const spatialVectorVariable = variable && isSpatialVectorVariable(variable);
    assert.ok(spatialImageVariable || spatialVectorVariable, 'geo-spatial variable expected');
    const restoredLayer = (savedLayers && savedLayers[variable.name]) as VariableImageLayerState;
    const layerDisplayProperties = updateVariableLayerVarIndex(variable, restoredLayer);
    return {
        ...restoredLayer,
        id: genLayerId(),
        type: spatialImageVariable ? 'VariableImage' : 'VariableVector',
        name: `${resource.name}/${variable.name}`,
        visible: true,
        resName: resource.name,
        varName: variable.name,
        ...layerDisplayProperties
    };
}

export function updateSelectedVariableLayer(selectedVariableLayer: LayerState,
                                            resource: ResourceState,
                                            variable: VariableState,
                                            savedLayers?: SavedLayers): LayerState {
    assert.ok(selectedVariableLayer);
    assert.ok(selectedVariableLayer.id === SELECTED_VARIABLE_LAYER_ID);
    const spatialImageVariable = variable && isSpatialImageVariable(variable);
    const spatialVectorVariable = variable && isSpatialVectorVariable(variable);
    if (spatialImageVariable || spatialVectorVariable) {
        const restoredLayer = (savedLayers && savedLayers[variable.name]) as VariableImageLayerState;
        const layerDisplayProperties = updateVariableLayerVarIndex(variable, restoredLayer);
        console.log("updateSelectedVariableLayer: ", variable.name, savedLayers, restoredLayer, layerDisplayProperties);
        return {
            ...selectedVariableLayer,
            ...restoredLayer,
            type: spatialImageVariable ? 'VariableImage' : 'VariableVector',
            name: `Sel. var.: ${resource.name}/${variable.name}`,
            resName: resource.name,
            varName: variable.name,
            ...layerDisplayProperties
        };
    } else {
        return {
            id: SELECTED_VARIABLE_LAYER_ID,
            type: 'Unknown' as any,
            name: variable ? 'Sel. var.: none (not geo-spatial)' : 'Sel. var.: none (no selection)',
            visible: selectedVariableLayer.visible,
            resName: null,
            varName: null,
            varIndex: null,
        } as any;
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
    if (variable.ndim
        && variable.ndim >= numSpatialDims
        && (!varIndex || varIndex.length != variable.ndim - numSpatialDims)) {
        return Array(variable.ndim - numSpatialDims).fill(0);
    }
    return varIndex;
}


function newVariableLayerDisplayProperties(variable: VariableState) {
    return {
        colorMapName: 'jet',
        displayMin: isNumber(variable.valid_min) ? variable.valid_min : 0.,
        displayMax: isNumber(variable.valid_max) ? variable.valid_max : 1.,
        alphaBlending: false,
        opacity: 1.0,
        brightness: 1.0,
        contrast: 1.0,
        hue: 0.0,
        saturation: 1.0,
        gamma: 1.0,
    };
}
