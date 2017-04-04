import {
    VariableState, VariableRefState, ResourceState, LayerState, VariableVectorLayerState,
    VariableImageLayerState, State, OperationState
} from "./state";
import {ViewState} from "./components/ViewState";

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

export function createLayerId() {
    return Math.floor((1 + Math.random()) * 0x10000000).toString(16) + '-' + Math.floor(Date.now()).toString(16);
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

export function findResource(resources: ResourceState[], ref: VariableRefState): ResourceState|null {
    return resources.find(r => r.name === ref.resName);
}

export function findVariable(resources: ResourceState[], ref: VariableRefState): VariableState|null {
    const resource = findResource(resources, ref);
    return resource && resource.variables.find(v => v.name === ref.varName);
}

export function findOperation(operations: OperationState[], name: string): OperationState|null {
    return operations && operations.find(op => op.qualifiedName === name || op.name === name);
}

let WORLD_VIEW_COUNTER = 1;

export function createWorldView(): ViewState {
    const id = ++WORLD_VIEW_COUNTER;
    return {
        title: `World (${id})`,
        id: `world-${id}`,
        type: 'world',
        iconName: "pt-icon-globe",
        data: {}
    };
}
