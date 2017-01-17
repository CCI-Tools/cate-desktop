import {LayerState, State, VariableState, ResourceState, VariableImageLayerState, ImageLayerState} from "./state";

export const resourcesSelector = (state: State): Array<ResourceState> => state.data.workspace.resources;
export const selectedResourceIdSelector = (state: State): string|null => state.control.selectedWorkspaceResourceId;
export const selectedVariableNameSelector = (state: State): string|null => state.control.selectedVariableName;
export const layersSelector = (state: State): Array<LayerState> => state.data.layers;
export const selectedLayerIdSelector = (state: State): string|null => state.control.selectedLayerId;

export const selectedResourceSelector = (state: State): ResourceState|null => {
    const resources = resourcesSelector(state);
    const selectedResourceId = selectedResourceIdSelector(state);
    return resources.find(r => r.name === selectedResourceId);
};

export const selectedVariablesSelector = (state: State): Array<VariableState>|null  => {
    const resource = selectedResourceSelector(state);
    return resource ? resource.variables : null;
};

export const selectedVariableSelector = (state: State): VariableState|null => {
    const selectedVariableName = selectedVariableNameSelector(state);
    const variables = selectedVariablesSelector(state);
    return (variables || []).find(v => v.name === selectedVariableName);
};

export const selectedLayerSelector = (state: State): LayerState|null => {
    const layers = layersSelector(state);
    const selectedLayerId = selectedLayerIdSelector(state);
    return layers.find(l => l.id === selectedLayerId);
};

export const selectedImageLayerSelector = (state: State): ImageLayerState|null => {
    const layer = selectedLayerSelector(state);
    if (layer && (layer.type === 'Image' || layer.type === 'VariableImage')) {
        return layer as ImageLayerState;
    }
    return null;
};

export const selectedVariableImageLayerSelector = (state: State): VariableImageLayerState|null => {
    const layer = selectedLayerSelector(state);
    if (layer && layer.type === 'VariableImage') {
        return layer as VariableImageLayerState;
    }
    return null;
};


