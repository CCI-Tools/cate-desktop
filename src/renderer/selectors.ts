import {
    LayerState, State, VariableState, ResourceState, VariableImageLayerState, ImageLayerState,
    ColorMapCategoryState, ColorMapState, OperationState, WorkspaceState, DataSourceState, DataStoreState, DialogState,
    WorkflowStepState, VariableVectorLayerState
} from "./state";
import {createSelector, Selector} from 'reselect';
import {WebAPIClient} from "./webapi/WebAPIClient";
import {DatasetAPI} from "./webapi/apis/DatasetAPI";
import {OperationAPI} from "./webapi/apis/OperationAPI";
import {WorkspaceAPI} from "./webapi/apis/WorkspaceAPI";
import {ColorMapsAPI} from "./webapi/apis/ColorMapsAPI";
import {BackendConfigAPI} from "./webapi/apis/BackendConfigAPI";

const EMPTY_OBJECT = {};
const EMPTY_ARRAY = [];

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Remote API selectors

export const webAPIClientSelector = (state: State): WebAPIClient => state.data.appConfig.webAPIClient;


export const backendConfigAPISelector = createSelector(
    webAPIClientSelector,
    (webAPIClient) => {
        return new BackendConfigAPI(webAPIClient);
    }
);


export const datasetAPISelector = createSelector(
    webAPIClientSelector,
    (webAPIClient) => {
        return new DatasetAPI(webAPIClient);
    }
);

export const operationAPISelector = createSelector(
    webAPIClientSelector,
    (webAPIClient) => {
        return new OperationAPI(webAPIClient);
    }
);

export const workspaceAPISelector = createSelector(
    webAPIClientSelector,
    (webAPIClient) => {
        return new WorkspaceAPI(webAPIClient);
    }
);

export const colorMapsAPISelector = createSelector(
    webAPIClientSelector,
    (webAPIClient) => {
        return new ColorMapsAPI(webAPIClient);
    }
);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Dialog state selectors

const DIALOG_STATE_SELECTORS: {[dialogId: string]: Selector<State, DialogState>} = {};
export const dialogStatesSelector = (state: State): {[dialogId: string]: DialogState} => state.control.dialogs;

export const dialogStateSelector = (dialogId: string) => {
    if (!DIALOG_STATE_SELECTORS[dialogId]) {
        DIALOG_STATE_SELECTORS[dialogId] = createSelector<State, DialogState, {[dialogId: string]: DialogState}>(
            dialogStatesSelector,
            (dialogStates: {[dialogId: string]: DialogState}) => dialogStates[dialogId] || EMPTY_OBJECT
        );
    }
    return DIALOG_STATE_SELECTORS[dialogId];
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Operation selectors

export const operationsSelector = (state: State): OperationState[]|null => state.data.operations;
export const operationFilterTagsSelector = (state: State): string[]|null => state.control.operationFilterTags;
export const operationFilterExprSelector = (state: State): string|null => state.control.operationFilterExpr;
export const selectedOperationNameSelector = (state: State): string|null => state.control.selectedOperationName;

export const selectedOperationSelector = createSelector<State, OperationState|null, OperationState[]|null, string|null>(
    operationsSelector,
    selectedOperationNameSelector,
    (operations, selectedOperationName) => {
        if (operations && operations.length && selectedOperationName) {
            return operations.find(op => op.name === selectedOperationName);
        }
        return null;
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
                const filterExprLC = operationFilterExpr.toLowerCase();
                const parts = filterExprLC.split(" ");
                nameMatches = ds => {
                    return parts.every(part => ds.name.toLowerCase().includes(part));
                };
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
        return operations || EMPTY_ARRAY;
    }
);

export const operationsTagCountsSelector = createSelector<State, Map<string, number>, OperationState[]|null>(
    operationsSelector,
    (operations) => {
        let tagCounts = new Map<string, number>();
        (operations || EMPTY_ARRAY).forEach((op: OperationState) => (op.tags || EMPTY_ARRAY).forEach((tag: string) => {
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
        if (canFind(dataStores, selectedDataStoreId)) {
            return dataStores.find(dataStore => dataStore.id === selectedDataStoreId);
        }
        return null;
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
            const parts = dataSourceFilterExprLC.split(" ");
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
        if (canFind(selectedDataSources, selectedDataSourceId)) {
            return selectedDataSources.find(dataSource => dataSource.id === selectedDataSourceId);
        }
        return null;
    }
);

export const selectedDataSourceTemporalCoverageSelector = createSelector<State, [string, string]|null, DataSourceState|null>(
    selectedDataSourceSelector,
    (selectedDataSource: DataSourceState) => {
        return selectedDataSource ? selectedDataSource.temporalCoverage : null;
    }
);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Workspace, resource, step, and variable selectors

export const workspaceSelector = (state: State): WorkspaceState|null => state.data.workspace;
export const workspaceBaseDirSelector = (state: State): string|null => state.data.workspace && state.data.workspace.baseDir;
export const resourcesSelector = (state: State): ResourceState[] => state.data.workspace ? state.data.workspace.resources : [];
export const workflowStepsSelector = (state: State): WorkflowStepState[] => state.data.workspace ? state.data.workspace.workflow.steps : [];
export const selectedResourceIdSelector = (state: State): string|null => state.control.selectedWorkspaceResourceId;
export const selectedWorkflowStepIdSelector = (state: State): string|null => state.control.selectedWorkflowStepId;
export const selectedVariableNameSelector = (state: State): string|null => state.control.selectedVariableName;
export const resourceNamePrefixSelector = (state: State): string => state.session.resourceNamePrefix;

export const selectedResourceSelector = createSelector<State, ResourceState|null, ResourceState[], string>(
    resourcesSelector,
    selectedResourceIdSelector,
    (resources: ResourceState[], selectedResourceId: string) => {
        if (canFind(resources, selectedResourceId)) {
            return resources.find(r => r.name === selectedResourceId);
        }
        return null;
    }
);

export const selectedWorkflowStepSelector = createSelector<State, WorkflowStepState|null, WorkflowStepState[], string>(
    workflowStepsSelector,
    selectedWorkflowStepIdSelector,
    (workflowSteps: WorkflowStepState[], selectedWorkflowStepId: string) => {
        if (canFind(workflowSteps, selectedWorkflowStepId)) {
            return workflowSteps.find(r => r.id === selectedWorkflowStepId);
        }
        return null;
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
    newResourceName
);

export function newResourceName(resources: ResourceState[], namePrefix: string): string {
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

export const variablesSelector = createSelector<State, VariableState[]|null, ResourceState|null>(
    selectedResourceSelector,
    (selectedResource: ResourceState|null) => {
        return selectedResource ? selectedResource.variables : null;
    }
);


export const selectedVariableSelector = createSelector<State, VariableState|null, VariableState[]|null, string|null>(
    variablesSelector,
    selectedVariableNameSelector,
    (selectedVariables: VariableState[]|null, selectedVariableName: string|null) => {
        if (canFind(selectedVariables, selectedVariableName)) {
            return (selectedVariables || EMPTY_ARRAY).find(v => v.name === selectedVariableName);
        }
        return null;
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
        if (canFind(layers, selectedLayerId)) {
            return layers.find(l => l.id === selectedLayerId);
        }
        return null;
    }
);

export const selectedLayerIndexSelector = createSelector<State, number, LayerState[], string>(
    layersSelector,
    selectedLayerIdSelector,
    (layers: LayerState[], selectedLayerId: string|null) => {
        if (canFind(layers, selectedLayerId)) {
            return layers.findIndex(l => l.id === selectedLayerId);
        }
        return -1;
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

export const selectedVariableVectorLayerSelector = createSelector<State, VariableVectorLayerState|null,LayerState|null>(
    selectedLayerSelector,
    (selectedLayer: LayerState|null) => {
        if (selectedLayer && selectedLayer.type === 'VariableVector') {
            return selectedLayer as VariableVectorLayerState;
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
        const selectedColorMapName = selectedImageLayer ? selectedImageLayer.colorMapName : null;
        if (canFind(colorMapCategories, selectedColorMapName)) {
            for (let cat of colorMapCategories) {
                const selectedColorMap = cat.colorMaps.find(cm => cm.name === selectedColorMapName);
                if (selectedColorMap) {
                    return selectedColorMap;
                }
            }
        }
        return null;
    }
);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Utilities

function canFind(array: any[], id: any): boolean {
    return array && array.length && id;
}





