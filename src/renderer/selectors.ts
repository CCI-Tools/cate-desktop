import {
    LayerState, State, VariableState, ResourceState, VariableImageLayerState, ImageLayerState,
    ColorMapCategoryState, ColorMapState, OperationState, WorkspaceState, DataSourceState, DataStoreState
} from "./state";
import {createSelector} from 'reselect';

// TODO (forman/marcoz): write more unit tests for selectors

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Operation selectors

export const operationsSelector = (state: State): OperationState[]|null => state.data.operations;
export const operationFilterTagsSelector = (state: State): string[]|null => state.control.operationFilterTags;
export const operationFilterExprSelector = (state: State): string|null => state.control.operationFilterExpr;
export const selectedOperationNameSelector = (state: State): string|null => state.control.selectedOperationName;

export const selectedOperationSelector = createSelector<State, OperationState|null, OperationState[]|null, string|null>(
    operationsSelector,
    selectedOperationNameSelector,
    (operations, selectedOperationName) => {
        if (selectedOperationName === null) {
            return null;
        }
        return (operations || []).find(op => op.name === selectedOperationName);
    }
);


export const filteredOperationsSelector = createSelector<State, OperationState[], OperationState[]|null, string[]|null, string|null>(
    operationsSelector,
    operationFilterTagsSelector,
    operationFilterExprSelector,
    (operations, operationFilterTags, operationFilterExpr) => {
        const hasOperations = operations && operations.length;
        const hasFilterExpr = operationFilterExpr && operationFilterExpr !== '';
        const hasFilterTags = operationFilterTags && operationFilterTags.length;
        if (hasOperations && (hasFilterExpr || hasFilterTags)) {
            let nameMatches;
            if (hasFilterExpr) {
                nameMatches = op => !operationFilterExpr || op.name.includes(operationFilterExpr);
            } else {
                nameMatches = op => true;
            }
            let hasTag;
            if (hasFilterTags) {
                hasTag = op => !operationFilterTags.length || operationFilterTags.every(tag => new Set(op.tags).has(tag));
            } else {
                hasTag = op => true;
            }
            return operations.filter(op => nameMatches(op) && hasTag(op));
        }
        return operations || [];
    }
);

export const operationsTagCountsSelector = createSelector<State, Map<string, number>, OperationState[]|null>(
    operationsSelector,
    (operations) => {
        let tagCounts = new Map<string, number>();
        (operations || []).forEach((op: OperationState) => (op.tags || []).forEach((tag: string) => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }));
        return tagCounts;
    }
);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Data store and data source selectors

export const dataStoresSelector = (state: State) => state.data.dataStores;
export const selectedDataStoreIdSelector = (state: State) => state.control.selectedDataStoreId;
export const selectedDataSourceIdSelector = (state: State) => state.control.selectedDataSourceId;
export const dataSourceFilterExprSelector = (state: State) => state.control.dataSourceFilterExpr;
export const showDataSourceDetailsSelector = (state: State) => state.control.showDataSourceDetails;

export const selectedDataStoreSelector = createSelector<State, DataStoreState|null, DataStoreState[]|null, string|null>(
    dataStoresSelector,
    selectedDataStoreIdSelector,
    (dataStores, selectedDataStoreId) => {
        if (!dataStores || !dataStores.length || !selectedDataStoreId) {
            return null;
        }
        return dataStores.find(dataStore => dataStore.id === selectedDataStoreId);
    }
);

export const selectedDataSourcesSelector = createSelector<State, DataSourceState[]|null, DataStoreState|null>(
    selectedDataStoreSelector,
    (selectedDataStore) => {
        return (selectedDataStore && selectedDataStore.dataSources) || null;
    }
);

export const filteredDataSourcesSelector = createSelector<State, DataSourceState[]|null, DataSourceState[]|null, string|null>(
    selectedDataSourcesSelector,
    dataSourceFilterExprSelector,
    (selectedDataSources, dataSourceFilterExpr) => {
        const hasDataSources = selectedDataSources && selectedDataSources.length;
        const hasFilterExpr = dataSourceFilterExpr && dataSourceFilterExpr !== '';
        if (hasDataSources && hasFilterExpr) {
            const dataSourceFilterExprLC = dataSourceFilterExpr.toLowerCase();
            const parts = dataSourceFilterExprLC.split(" ")
            const nameMatches = ds => {
                return parts.every(part => ds.name.toLowerCase().includes(part));
            };
            return selectedDataSources.filter(ds => nameMatches(ds));
        }
        return selectedDataSources;
    }
);

export const selectedDataSourceSelector = createSelector<State, DataSourceState|null, DataSourceState[]|null,  string|null>(
    selectedDataSourcesSelector,
    selectedDataSourceIdSelector,
    (selectedDataSources, selectedDataSourceId) => {
        if (!selectedDataSources || !selectedDataSourceId) {
            return null;
        }
        return selectedDataSources.find(dataSource => dataSource.id === selectedDataSourceId);
    }
);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Workspace, resource, step, and variable selectors

export const workspaceSelector = (state: State): WorkspaceState|null => state.data.workspace;
export const resourcesSelector = (state: State): Array<ResourceState> => state.data.workspace ? state.data.workspace.resources : [];
export const selectedResourceIdSelector = (state: State): string|null => state.control.selectedWorkspaceResourceId;
export const selectedVariableNameSelector = (state: State): string|null => state.control.selectedVariableName;
export const resourceNamePrefixSelector = (state: State): string => state.session.resourceNamePrefix;

export const selectedResourceSelector = createSelector<State, ResourceState|null, ResourceState[], string>(
    resourcesSelector,
    selectedResourceIdSelector,
    (resources: ResourceState[], selectedResourceId: string) => {
        return resources.find(r => r.name === selectedResourceId);
    }
);

/**
 * Generate a new resource name based on resourceNamePrefix and the largest resource index used so far
 * in the given resources.
 * @param namePrefix the prefix for the resource name
 * @param resources the used resources
 * @returns {string} a new resource name
 */
export const newResourceNameSelector = createSelector<State, string, ResourceState[], string>(
    resourcesSelector,
    resourceNamePrefixSelector,
    (resources: ResourceState[], namePrefix: string): string => {
        if (!resources || !namePrefix) {
            return "";
        }
        let maxNameIndex = 0;
        for (let resource of resources) {
            const resourceName = resource.name;
            if (resourceName.startsWith(namePrefix)) {
                try {
                    const nameIndex = parseInt(resourceName.substr(namePrefix.length));
                    maxNameIndex = Math.max(nameIndex, maxNameIndex);
                } catch (e) {
                    // ok
                }
            }
        }
        return `${namePrefix}${maxNameIndex + 1}`;
    }
);


export const selectedVariablesSelector = createSelector<State, VariableState[]|null, ResourceState|null>(
    selectedResourceSelector,
    (selectedResource: ResourceState|null) => {
        return selectedResource ? selectedResource.variables : null;
    }
);


export const selectedVariableSelector = createSelector<State, VariableState|null, VariableState[]|null, string|null>(
    selectedVariablesSelector,
    selectedVariableNameSelector,
    (selectedVariables: VariableState[]|null, selectedVariableName: string|null) => {
        return (selectedVariables || []).find(v => v.name === selectedVariableName);
    }
);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Layer selectors

export const layersSelector = (state: State): Array<LayerState> => state.data.layers;
export const selectedLayerIdSelector = (state: State): string|null => state.control.selectedLayerId;

export const selectedLayerSelector = createSelector<State, LayerState|null, LayerState[], string>(
    layersSelector,
    selectedLayerIdSelector,
    (layers: LayerState[], selectedLayerId: string|null) => {
        return layers.find(l => l.id === selectedLayerId);
    }
);

export const selectedImageLayerSelector = createSelector<State, ImageLayerState|null,LayerState|null>(
    selectedLayerSelector,
    (selectedLayer: LayerState|null) => {
        if (selectedLayer && (selectedLayer.type === 'Image' || selectedLayer.type === 'VariableImage')) {
            return selectedLayer as ImageLayerState;
        }
        return null;
    }
);

export const selectedVariableImageLayerSelector = createSelector<State, VariableImageLayerState|null,LayerState|null>(
    selectedLayerSelector,
    (selectedLayer: LayerState|null) => {
        if (selectedLayer && selectedLayer.type === 'VariableImage') {
            return selectedLayer as VariableImageLayerState;
        }
        return null;
    }
);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Color map selectors

export const colorMapCategoriesSelector = (state: State): Array<ColorMapCategoryState> => state.data.colorMaps;

export const selectedColorMapSelector = createSelector<State, ColorMapState, ColorMapCategoryState[]|null, VariableImageLayerState|null>(
    colorMapCategoriesSelector,
    selectedVariableImageLayerSelector,
    (colorMapCategories: ColorMapCategoryState[]|null, selectedImageLayer: VariableImageLayerState|null) => {
        if (!colorMapCategories || !selectedImageLayer || !selectedImageLayer.colorMapName) {
            return null;
        }
        for (let cat of colorMapCategories) {
            const selectedColorMap = cat.colorMaps.find(cm => cm.name === selectedImageLayer.colorMapName);
            if (selectedColorMap) {
                return selectedColorMap;
            }
        }
        return null;
    }
);






