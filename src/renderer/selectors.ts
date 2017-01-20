import {
    LayerState, State, VariableState, ResourceState, VariableImageLayerState, ImageLayerState,
    ColorMapCategoryState
} from "./state";

// TODO (forman/marcoz): write unit tests for actions
// TODO (forman/marcoz): use reselect JS library

export const resourcesSelector = (state: State): Array<ResourceState> => state.data.workspace.resources;
export const selectedResourceIdSelector = (state: State): string|null => state.control.selectedWorkspaceResourceId;
export const selectedVariableNameSelector = (state: State): string|null => state.control.selectedVariableName;
export const layersSelector = (state: State): Array<LayerState> => state.data.layers;
export const selectedLayerIdSelector = (state: State): string|null => state.control.selectedLayerId;
export const colorMapCategoriesSelector = (state: State): Array<ColorMapCategoryState> => state.data.colorMaps;

// Note this is composite selector, with reselect use:
//    selectedResourceSelector = createSelector(resourcesSelector, selectedResourceIdSelector, (resources, selectedResourceId) => {...})
//
export const selectedResourceSelector = (state: State): ResourceState|null => {
    const resources = resourcesSelector(state);
    const selectedResourceId = selectedResourceIdSelector(state);
    return resources.find(r => r.name === selectedResourceId);
};

// Note this is composite selector, with reselect use:
//    selectedVariablesSelector = createSelector(selectedResourceSelector, resource => {...})
//
export const selectedVariablesSelector = (state: State): Array<VariableState>|null  => {
    const resource = selectedResourceSelector(state);
    return resource ? resource.variables : null;
};

// Note this is composite selector, with reselect use:
//    selectedVariableSelector = createSelector(selectedVariableNameSelector, selectedVariablesSelector, (variables, selectedVariableName) => {...})
//
export const selectedVariableSelector = (state: State): VariableState|null => {
    const variables = selectedVariablesSelector(state);
    const selectedVariableName = selectedVariableNameSelector(state);
    return (variables || []).find(v => v.name === selectedVariableName);
};

// Note this is composite selector, with reselect use:
//    selectedLayerSelector = createSelector(layersSelector, (layers, selectedLayerId) => {...})
//
export const selectedLayerSelector = (state: State): LayerState|null => {
    const layers = layersSelector(state);
    const selectedLayerId = selectedLayerIdSelector(state);
    return layers.find(l => l.id === selectedLayerId);
};

// Note this is composite selector, with reselect use:
//    selectedImageLayerSelector = createSelector(selectedLayerSelector, layer => {...})
//
export const selectedImageLayerSelector = (state: State): ImageLayerState|null => {
    const layer = selectedLayerSelector(state);
    if (layer && (layer.type === 'Image' || layer.type === 'VariableImage')) {
        return layer as ImageLayerState;
    }
    return null;
};

// Note this is composite selector, with reselect use:
//    selectedVariableImageLayerSelector = createSelector(selectedLayerSelector, layer => {...})
//
export const selectedVariableImageLayerSelector = (state: State): VariableImageLayerState|null => {
    const layer = selectedLayerSelector(state);
    if (layer && layer.type === 'VariableImage') {
        return layer as VariableImageLayerState;
    }
    return null;
};

// Note this is composite selector, with reselect use:
//    selectedColorMapSelector = createSelector(colorMapCategoriesSelector, selectedImageLayerSelector, (colorMapCategories, selectedLayer) => {...})
//
export const selectedColorMapSelector = (colorMapCategories: Array<ColorMapCategoryState>|null, selectedLayer: VariableImageLayerState|null) => {
    if (!colorMapCategories || !selectedLayer || !selectedLayer.colorMapName) {
        return null;
    }
    for (let cat of colorMapCategories) {
        const selectedColorMap = cat.colorMaps.find(cm => cm.name === selectedLayer.colorMapName);
        if (selectedColorMap) {
            return selectedColorMap;
        }
    }
    return null;
};






