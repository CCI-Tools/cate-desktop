import {
    VariableState, VariableRefState, ResourceState, LayerState, VariableVectorLayerState,
    VariableImageLayerState, State, OperationState, WorldViewDataState
} from "./state";
import {ViewState} from "./components/ViewState";
import * as assert from "../common/assert";
import {isNumber} from "../common/types";

export type GetState = () => State;

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

export function getGeoJSONCountriesUrl(baseUrl: string): string {
    return baseUrl + 'ws/countries/0';
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
    return resource && resource.variables.find(v => v.name === ref.varName);
}

export function findOperation(operations: OperationState[], name: string): OperationState | null {
    return operations && operations.find(op => op.qualifiedName === name || op.name === name);
}

let WORLD_VIEW_COUNTER = 1;


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

export function newVariableLayer(resource: ResourceState, variable: VariableState, savedLayers?: {[name: string]: LayerState}) {
    assert.ok(resource);
    assert.ok(variable);

    const layerId = genLayerId();

    let layerType;
    if (isSpatialImageVariable(variable)) {
        layerType = 'VariableImage';
    } else if (isSpatialVectorVariable(variable)) {
        layerType = 'VariableVector';
    }
    assert.ok(layerType, 'illegal variable');

    const restoredLayer = (savedLayers && savedLayers[variable.name]) as VariableImageLayerState;

    let layerDisplayProperties;
    let varIndex;
    if (restoredLayer) {
        varIndex = restoredLayer.varIndex && restoredLayer.varIndex.slice();
    } else {
        layerDisplayProperties = newVariableLayerDisplayProperties(variable);
    }

    if (variable.ndim >= 2 && (!varIndex || varIndex.length != variable.ndim - 2)) {
        varIndex = Array(variable.ndim - 2).fill(0);
    }

    return Object.assign({}, restoredLayer, {
        id: genLayerId(),
        type: layerType,
        visible: true,
        resName: resource.name,
        varName: variable.name,
        varIndex,
    }, layerDisplayProperties);
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

