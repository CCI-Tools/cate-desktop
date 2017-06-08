import {
    LayerState, State, VariableState, ResourceState, VariableImageLayerState, ImageLayerState,
    ColorMapCategoryState, ColorMapState, OperationState, WorkspaceState, DataSourceState, DataStoreState, DialogState,
    WorkflowStepState, VariableVectorLayerState, LayerVariableState, SavedVariableLayers, MplModuleState
} from "./state";
import {createSelector, Selector} from 'reselect';
import {WebAPIClient} from "./webapi/WebAPIClient";
import {DatasetAPI} from "./webapi/apis/DatasetAPI";
import {OperationAPI} from "./webapi/apis/OperationAPI";
import {WorkspaceAPI} from "./webapi/apis/WorkspaceAPI";
import {ColorMapsAPI} from "./webapi/apis/ColorMapsAPI";
import {BackendConfigAPI} from "./webapi/apis/BackendConfigAPI";
import {PanelContainerLayout} from "./components/PanelContainer";
import {isSpatialVectorVariable, isSpatialImageVariable, findOperation} from "./state-util";
import {ViewState, ViewLayoutState} from "./components/ViewState";
import {isDefinedAndNotNull, isNumber} from "../common/types";

const EMPTY_OBJECT = {};
export const EMPTY_ARRAY = [];

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Remote API selectors

export const webAPIClientSelector = (state: State): WebAPIClient => state.data.appConfig.webAPIClient;
export const webAPIRestUrlSelector = (state: State): string => state.data.appConfig.webAPIConfig.restUrl;
export const mplWebSocketSelector = (state: State): WebSocket|null => state.data.appConfig.mplWebSocket;
export const mplModuleSelector = (state: State): MplModuleState => state.data.appConfig.mplModule;


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
// ApplicationPage layout selectors

export const panelContainerUndockedModeSelector = (state: State): boolean => state.session.panelContainerUndockedMode;

export const leftPanelContainerLayoutSelector = (state: State): PanelContainerLayout => state.session.leftPanelContainerLayout;
export const rightPanelContainerLayoutSelector = (state: State): PanelContainerLayout => state.session.rightPanelContainerLayout;

export const selectedLeftTopPanelIdSelector = (state: State): string | null => state.session.selectedLeftTopPanelId;
export const selectedLeftBottomPanelIdSelector = (state: State): string
    | null => state.session.selectedLeftBottomPanelId;
export const selectedRightTopPanelIdSelector = (state: State): string | null => state.session.selectedRightTopPanelId;
export const selectedRightBottomPanelIdSelector = (state: State): string
    | null => state.session.selectedRightBottomPanelId;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Operation selectors

export const operationsSelector = (state: State): OperationState[] | null => state.data.operations;
export const operationFilterTagsSelector = (state: State): string[] | null => state.control.operationFilterTags;
export const operationFilterExprSelector = (state: State): string | null => state.control.operationFilterExpr;
export const selectedOperationNameSelector = (state: State): string | null => state.control.selectedOperationName;

export const selectedOperationSelector = createSelector<State, OperationState | null, OperationState[] | null,
    string
        | null>(
    operationsSelector,
    selectedOperationNameSelector,
    (operations, selectedOperationName) => {
        if (operations && operations.length && selectedOperationName) {
            return operations.find(op => op.name === selectedOperationName);
        }
        return null;
    }
);

export const filteredOperationsSelector = createSelector<State, OperationState[], OperationState[] | null,
    string[]
        | null, string | null>(
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

export const operationsTagCountsSelector = createSelector<State, Map<string, number>, OperationState[] | null>(
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

export const selectedDataStoreSelector = createSelector<State, DataStoreState | null, DataStoreState[] | null,
    string
        | null>(
    dataStoresSelector,
    selectedDataStoreIdSelector,
    (dataStores, selectedDataStoreId) => {
        if (canFind(dataStores, selectedDataStoreId)) {
            return dataStores.find(dataStore => dataStore.id === selectedDataStoreId);
        }
        return null;
    }
);

export const selectedDataSourcesSelector = createSelector<State, DataSourceState[] | null, DataStoreState | null>(
    selectedDataStoreSelector,
    (selectedDataStore) => {
        return (selectedDataStore && selectedDataStore.dataSources) || null;
    }
);

export const filteredDataSourcesSelector = createSelector<State, DataSourceState[] | null, DataSourceState[] | null,
    string | null>(
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

export const selectedDataSourceSelector = createSelector<State, DataSourceState | null, DataSourceState[] | null,
    string
        | null>(
    selectedDataSourcesSelector,
    selectedDataSourceIdSelector,
    (selectedDataSources, selectedDataSourceId) => {
        if (canFind(selectedDataSources, selectedDataSourceId)) {
            return selectedDataSources.find(dataSource => dataSource.id === selectedDataSourceId);
        }
        return null;
    }
);

export const protocolNameSelector = createSelector<State, string | null, DataSourceState | null>(
    selectedDataSourceSelector,
    (dataSource: DataSourceState | null) => {
        let protocolName = null;
        if (dataSource && dataSource.meta_info) {
            const protocols = dataSource.meta_info.protocols;
            if (protocols && protocols.length > 1) {
                protocolName = protocols[0];
            }
        }
        return protocolName;
    }
);

export const selectedDataSourceTemporalCoverageSelector = createSelector<State, [string, string] | null,
    DataSourceState
        | null>(
    selectedDataSourceSelector,
    (selectedDataSource: DataSourceState): [string, string] | null => {
        return selectedDataSource ? selectedDataSource.temporalCoverage : null;
    }
);

export const selectedDataSourceTemporalCoverageMillisSelector = createSelector<State, [number, number] | null,
    [string, string]
        | null>(
    selectedDataSourceTemporalCoverageSelector,
    (temporalCoverage: [string, string] | null): [number, number] | null => {
        if (temporalCoverage) {
            let ms1 = Date.parse(temporalCoverage[0]);
            let ms2 = Date.parse(temporalCoverage[1]);
            return [ms1, ms2];
        }
        return null;
    }
);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Workspace, resource, step, and variable selectors

export const workspaceSelector = (state: State): WorkspaceState | null => state.data.workspace;
export const workspaceBaseDirSelector = (state: State): string
    | null => state.data.workspace && state.data.workspace.baseDir;
export const resourcesSelector = (state: State): ResourceState[] => state.data.workspace ? state.data.workspace.resources : EMPTY_ARRAY;
export const workflowStepsSelector = (state: State): WorkflowStepState[] => state.data.workspace ? state.data.workspace.workflow.steps : EMPTY_ARRAY;
export const showResourceDetailsSelector = (state: State): boolean => state.control.showResourceDetails;
export const selectedResourceIdSelector = (state: State): string | null => state.control.selectedWorkspaceResourceId;
export const showWorkflowStepDetailsSelector = (state: State): boolean => state.control.showWorkflowStepDetails;
export const selectedWorkflowStepIdSelector = (state: State): string | null => state.control.selectedWorkflowStepId;
export const selectedVariableNameSelector = (state: State): string | null => state.control.selectedVariableName;
export const resourceNamePrefixSelector = (state: State): string => state.session.resourceNamePrefix;

export const resourceNamesSelector = createSelector<State, string[], ResourceState[]>(
    resourcesSelector,
    (resources: ResourceState[]) => {
        return resources.map(r => r.name)
    }
);

export const selectedResourceSelector = createSelector<State, ResourceState | null, ResourceState[], string>(
    resourcesSelector,
    selectedResourceIdSelector,
    (resources: ResourceState[], selectedResourceId: string) => {
        if (canFind(resources, selectedResourceId)) {
            return resources.find(r => r.name === selectedResourceId);
        }
        return null;
    }
);

export const selectedWorkflowStepSelector = createSelector<State,
    WorkflowStepState
        | null, WorkflowStepState[], string>(
    workflowStepsSelector,
    selectedWorkflowStepIdSelector,
    (workflowSteps: WorkflowStepState[], selectedWorkflowStepId: string) => {
        if (canFind(workflowSteps, selectedWorkflowStepId)) {
            return workflowSteps.find(r => r.id === selectedWorkflowStepId);
        }
        return null;
    }
);

export const selectedWorkflowStepOpSelector = createSelector<State, OperationState | null, OperationState[] | null,
    WorkflowStepState
        | null>(
    operationsSelector,
    selectedWorkflowStepSelector,
    (operations: OperationState[] | null, selectedWorkflowStep: WorkflowStepState | null) => {
        if (operations && selectedWorkflowStep && selectedWorkflowStep.op) {
            return findOperation(operations, selectedWorkflowStep.op);
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

export const figureResourcesSelector = createSelector<State, ResourceState[], ResourceState[]>(
    resourcesSelector,
    (resources: ResourceState[]) => {
        return resources.filter(r => isNumber(r.figureId))
    }
);

export const variablesSelector = createSelector<State, VariableState[] | null, ResourceState | null>(
    selectedResourceSelector,
    (selectedResource: ResourceState | null) => {
        return selectedResource ? (selectedResource.variables || null) : null;
    }
);


export const selectedVariableSelector = createSelector<State, VariableState | null, VariableState[] | null,
    string
        | null>(
    variablesSelector,
    selectedVariableNameSelector,
    (selectedVariables: VariableState[] | null, selectedVariableName: string | null) => {
        if (canFind(selectedVariables, selectedVariableName)) {
            return (selectedVariables || EMPTY_ARRAY).find(v => v.name === selectedVariableName);
        }
        return null;
    }
);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Viewer selectors

export const viewLayoutSelector = (state: State): ViewLayoutState => state.control.viewLayout;
export const viewsSelector = (state: State): ViewState<any>[] => state.control.views;
export const activeViewIdSelector = (state: State): string | null => state.control.activeViewId;

export const activeViewSelector = createSelector<State, ViewState<any> | null, ViewState<any>[], string | null>(
    viewsSelector,
    activeViewIdSelector,
    (views: ViewState<any>[], activeViewId) => {
        if (canFind(views, activeViewId)) {
            return views.find(view => view.id === activeViewId);
        }
        return null;
    }
);

export const activeViewTypeSelector = createSelector<State, string | null, ViewState<any> | null>(
    activeViewSelector,
    (view: ViewState<any>) => {
        return view ? view.type : null
    }
);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Layer selectors

export const savedLayersSelector = (state: State): SavedVariableLayers => state.control.savedLayers;

export const selectedLayerIdSelector = createSelector<State, string | null, ViewState<any> | null>(
    activeViewSelector,
    (view: ViewState<any> | null) => {
        return (view && view.data.selectedLayerId) || null;
    }
);

export const layersSelector = createSelector<State, LayerState[] | null, ViewState<any> | null>(
    activeViewSelector,
    (view: ViewState<any> | null) => {
        return (view && view.data.layers) || null;
    }
);

export const selectedLayerSelector = createSelector<State, LayerState | null, LayerState[], string | null>(
    layersSelector,
    selectedLayerIdSelector,
    (layers: LayerState[] | null, selectedLayerId: string | null): LayerState | null => {
        if (canFind(layers, selectedLayerId)) {
            return layers.find(l => l.id === selectedLayerId);
        }
        return null;
    }
);

export const selectedLayerIndexSelector = createSelector<State, number, LayerState[], string>(
    layersSelector,
    selectedLayerIdSelector,
    (layers: LayerState[] | null, selectedLayerId: string | null): number => {
        if (canFind(layers, selectedLayerId)) {
            return layers.findIndex(l => l.id === selectedLayerId);
        }
        return -1;
    }
);

export const selectedImageLayerSelector = createSelector<State, ImageLayerState | null, LayerState | null>(
    selectedLayerSelector,
    (selectedLayer: LayerState | null) => {
        if (selectedLayer && (selectedLayer.type === 'Image' || selectedLayer.type === 'VariableImage')) {
            return selectedLayer as ImageLayerState;
        }
        return null;
    }
);

export const selectedVariableImageLayerSelector = createSelector<State, VariableImageLayerState | null,
    LayerState | null>(
    selectedLayerSelector,
    (selectedLayer: LayerState | null) => {
        if (selectedLayer && selectedLayer.type === 'VariableImage') {
            return selectedLayer as VariableImageLayerState;
        }
        return null;
    }
);

export const selectedVariableVectorLayerSelector = createSelector<State, VariableVectorLayerState | null,
    LayerState | null>(
    selectedLayerSelector,
    (selectedLayer: LayerState | null) => {
        if (selectedLayer && selectedLayer.type === 'VariableVector') {
            return selectedLayer as VariableVectorLayerState;
        }
        return null;
    }
);


export const selectedLayerVariablesSelector = createSelector<State, LayerVariableState[] | null, ResourceState[]>(
    resourcesSelector,
    (resources: ResourceState[]) => {
        const layerVariables = [];
        for (let resource of resources) {
            if (resource.variables) {
                for (let variable of resource.variables) {
                    if (isSpatialImageVariable(variable) || isSpatialVectorVariable(variable)) {
                        layerVariables.push({resource, variable});
                    }
                }
            }
        }
        return layerVariables;
    }
);


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Color map selectors

export const colorMapCategoriesSelector = (state: State): Array<ColorMapCategoryState> => state.data.colorMaps;

export const selectedColorMapSelector = createSelector<State, ColorMapState, ColorMapCategoryState[] | null,
    VariableImageLayerState
        | null>(
    colorMapCategoriesSelector,
    selectedVariableImageLayerSelector,
    (colorMapCategories: ColorMapCategoryState[] | null, selectedImageLayer: VariableImageLayerState | null) => {
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

function canFind(array: any[], id: string): boolean {
    return array && array.length && !!id;
}





