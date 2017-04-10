import  {WebAPIClient} from './webapi';
import {JobStatus, JobFailure, JobProgress} from "./webapi/Job";
import {PanelContainerLayout} from "./components/PanelContainer";
import {ViewLayoutState, ViewState} from "./components/ViewState";
import {ChartState} from "./components/plotly/PlotlyPanel";

/**
 * Interface describing Cate's application state structure.
 * Cate's application state is a giant, structured, plain JavaScript object.
 *
 * It is modelled after the principles explained in http://jamesknelson.com/5-types-react-application-state/.
 *
 * @author Norman Fomferra
 */

export interface State {
    data: DataState;
    communication: CommunicationState;
    control: ControlState;
    session: SessionState;
    location: LocationState; // not used
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DataState

/**
 * Cate's domain data which is usually received from the Cate WebAPI service.
 */
export interface DataState {
    appConfig: AppConfigState; // TBD: move this to session?
    dataStores: DataStoreState[] | null;
    operations: OperationState[] | null;
    workspace: WorkspaceState | null;
    colorMaps: ColorMapCategoryState[] | null;
}

export interface AppConfigState {
    // Maybe put it into the communication state, see http://jamesknelson.com/5-types-react-application-state/
    // and see https://github.com/trbngr/react-example-pusher
    webAPIClient: WebAPIClient | null;
    webAPIConfig: WebAPIConfig;
}

export interface WebAPIConfig {
    // Values read by main.ts from ./cate-config.js
    command?: string;
    servicePort: number;
    serviceAddress: string;
    serviceFile?: string;
    processOptions?: Object;
    useMockService?: boolean;
    // Values computed in main.ts
    restUrl: string;
    webSocketUrl: string;
}

export interface DataStoreState {
    id: string;
    name: string;
    description: string;
    dataSources?: DataSourceState[] | null;
}

export interface DataSourceState {
    id: string;
    name: string;
    meta_info: any | null;
    temporalCoverage?: any | null;
}

export interface OperationState {
    name: string;
    qualifiedName: string;
    hasMonitor: boolean;
    description: string|null;
    tags: Array<string>;
    inputs: OperationInputState[];
    outputs: OperationOutputState[];
}

// see https://github.com/electron/electron/blob/master/docs/api/dialog.md
// see https://github.com/electron/electron/blob/master/docs/api/structures/file-filter.md
export interface FileFilterState {
    name: string;
    extensions: string[];
}

export interface OperationIOBaseState {
    name: string;
    dataType: string;
    description: string|null;
    units?: string|null;
}

export interface OperationInputState extends OperationIOBaseState {
    /* optional properties used mainly for validation */
    defaultValue?: any;
    nullable?: boolean;
    valueSet?: any[];
    valueSetSource?: string;
    valueRange?: [number, number]|[string, string];
    fileOpenMode?: 'w' | 'r' | 'rw';
    fileFilters?: FileFilterState[];
    fileProps?: string;
}

export interface OperationOutputState extends OperationIOBaseState {
}

/**
 * An operation argument that refers to a constant value.
 */
export interface OperationArgumentValue {
    value: any;
}

/**
 * An operation argument that refers to another resource.
 */
export interface OperationArgumentSource {
    /**
     * Resource name. May later also use syntax "<resource>.<outputName>" or "<resource>[<variableName>]".
     */
    source: string;
}

/**
 * Operation argument.
 */
export type OperationArg = OperationArgumentValue|OperationArgumentSource;

/**
 * Positional operation argument list.
 */
//export type OperationArgs = OperationArg[];

/**
 * Non-positional operation keyword-arguments.
 */
export type OperationKWArgs = {[name: string]: OperationArg};

export interface WorkspaceState {
    /**
     * The workspace's base directory path.
     */
    baseDir: string;
    /**
     * The workspace's description.
     */
    description: string|null;
    /**
     * Is it a scratch workspace? Scratch workspaces must be saved-as to some real location.
     */
    isScratch: boolean;
    /**
     * Has it been modified since it has been created, opened, or saved?
     */
    isModified: boolean;
    /**
     * Has it been saved before?
     */
    isSaved: boolean;
    /**
     * The workflow and its steps.
     */
    workflow: WorkflowState;
    /**
     * Information about the resources
     */
    resources: ResourceState[];
}

export interface WorkflowState {
    steps: WorkflowStepState[];
}

export interface WorkflowStepState {
    /**
     * Step ID. The ID will be used as Workspace's resource name.
     */
    id: string;

    /**
     * Step type.
     */
    type: 'operation'|'workflow'|'python-expression'|'python-script'|'executable';

    /**
     * The actual action to be performed. Allowed values depend on 'type'.
     * For example, 'op' is the operation's name, if type==="operation".
     */
    op: string;

    input: {[name:string]: WorkflowPortState};
    output: {[name:string]: WorkflowPortState};
}

/**
 * See cate-core/cate/core/workspace.py, class NodePort
 */
export interface WorkflowPortState {
    /**
     * A constant value.
     * Constraint: value!==undefined, if sourceRef===null.
     */
    value: any|undefined;
    /**
     * Reference to a step which provides the value of this port.
     * Constraint: sourceRef!==null, if value===undefined.
     *
     * Source reference can either be the ID of another (single-output) step or it can have the form
     * "stepId.outputPort" if it refers to specific output of a (multi-output) step.
     */
    source: string|null;
}

export type DimSizes = {[dimName: string]: number};
export type Attribute = [string, any];

// TODO (forman): harmonize ResourceState + VariableState, in the end
//                1. ResourceState is-a VariableState
//                2. ResourceState has-zero-or-more VariableStates
//                3. VariableState also has a path name


export interface ResourceState {
    name: string;
    dataType: string;
    dims?: DimSizes;
    attrs?: Attribute[];
    variables: VariableState[];
}

export interface VariableState {
    name : string;
    dataType: string;
    ndim?: number;
    shape?: number[];
    dimensions?: string[];
    chunks?: number[];
    valid_min?: number;
    valid_max?: number;
    add_offset?: number;
    scale_factor?: number;
    standard_name?: string;
    long_name?: string;
    units?: string;
    comment?: string;
    imageLayout?: ImageLayout;
    isFeatureAttribute?: boolean;
}

/**
 * Image layout for use with Cesium and OpenLayers.
 */
export interface ImageLayout {
    sector?: {
        /** The westernmost longitude, in radians, in the range [-Pi, Pi]. */
        west: number,
        /** The southernmost latitude, in radians, in the range [-Pi/2, Pi/2]. */
        south: number,
        /** The easternmost longitude, in radians, in the range [-Pi, Pi]. */
        east: number,
        /** The northernmost latitude, in radians, in the range [-Pi/2, Pi/2]. */
        north: number
    };
    ellipsoid?: {
        /** The radius in the x direction. */
        x: number;
        /** The radius in the y direction. */
        y: number;
        /** The radius in the z direction. */
        z: number;
    };
    numLevels: number;
    numLevelZeroTilesX: number;
    numLevelZeroTilesY: number;
    tileWidth: number;
    tileHeight: number;
}

export type WorldViewMode = "2D" | "3D";

/**
 * Data object for view type "world".
 */
export interface WorldViewDataState {
    /**
     * 2D map or 3D globe?
     */
    viewMode: WorldViewMode;

    /**
     * Code of the projection used by the 2D map.
     */
    projectionCode: string;

    /**
     * The layers in a viewer.
     */
    layers: LayerState[];

    /**
     * The ID of the selected layer.
     */
    selectedLayerId: string|null;
}

export interface ChartViewDataState {
    /**
     * The layers in a viewer.
     */
    charts: VariableChartState[];

    /**
     * The ID of the selected layer.
     */
    selectedChartId: string|null;
}

export interface VariableChartState extends ChartState, VariableRefState {
    varIndex: (number|null)[];
}


/**
 * State of a layer.
 */
export interface LayerState {
    /**
     * Layer ID.
     */
    id: string;

    /**
     * Layer type
     */
    type: 'VariableImage'|'VariableVector'|'Image'|'Vector'|'Unknown';

    /**
     * Layer name.
     */
    name?: string|null;

    /**
     * True if the layer is visible and shown; otherwise, false.
     */
    visible: boolean;

    /**
     * The layer's opacity.
     */
    opacity?: number;
}

export interface ImageStatisticsState {
    /**
     * The true minimum value in the current data subset.
     */
    min: number;

    /**
     * The true maximum value in the current data subset.
     */
    max: number;
}

/**
 * Base of image layers.
 */
export interface ImageLayerBase extends LayerState {
    /**
     * The brightness of this layer. 1.0 uses the unmodified imagery color.
     * Less than 1.0 makes the imagery darker while greater than 1.0 makes it brighter.
     */
    brightness: number;

    /**
     * The contrast of this layer. 1.0 uses the unmodified imagery color.
     * Less than 1.0 reduces the contrast while greater than 1.0 increases it.
     */
    contrast: number;

    /**
     * The hue of this layer. 0.0 uses the unmodified imagery color.
     */
    hue: number;

    /**
     * The saturation of this layer. 1.0 uses the unmodified imagery color.
     * Less than 1.0 reduces the saturation while greater than 1.0 increases it.
     */
    saturation: number;

    /**
     * The gamma correction to apply to this layer. 1.0 uses the unmodified imagery color.
     */
    gamma: number;
}

/**
 * State of an image layer.
 */
export interface ImageLayerState extends ImageLayerBase {
    /**
     * The image type ID.
     */
    type: 'Image';
}

/**
 * State of a vector layer.
 */
export interface VectorLayerState extends LayerState {
    /**
     * The image type ID.
     */
    type: 'Vector';
    /**
     * The (GeoJSON-providing) URL.
     */
    url?: string;
}

/**
 * Variable reference
 */
export interface VariableRefState {
    /**
     * The name of the resource that contains the variable.
     */
    resName: string;
    /**
     * The name of the variable.
     */
    varName: string;
}

/**
 * Variable data reference
 */
export interface VariableDataRefState extends VariableRefState {
    /**
     * The current index into the variable that results in a 2D-subset (i.e. with dims ['lat', 'lon']).
     */
    varIndex: number[];
}

/**
 * State of an image layer that displays a variable.
 */
export interface VariableLayerBase extends LayerState, VariableDataRefState {
    /**
     * Image layer minimum display value.
     */
    displayMin: number;
    /**
     * Image layer maximum display value.
     */
    displayMax: number;
    /**
     * Image layer color map name.
     */
    colorMapName: string;
    /**
     * Whether to blend alpha 0...1 at bottom value range.
     */
    alphaBlending: boolean;
    /**
     * Image enhancement attributes.
     */
    statistics?: ImageStatisticsState;
}

/**
 * State of an image layer that displays a variable.
 */
export interface VariableImageLayerState extends ImageLayerBase, VariableLayerBase {
    /**
     * The image type ID.
     */
    type: 'VariableImage';
}

/**
 * State of an image layer that displays a variable.
 */
export interface VariableVectorLayerState extends VariableLayerBase {
    /**
     * The image type ID.
     */
    type: 'VariableVector';
}

/**
 * An object comprising the resource and one of its variables which can be represented as a spatial 2D layer.
 */
export class LayerVariableState {
    /**
     * The resource.
     */
    resource: ResourceState;
    /**
     * A spatial 2D variable within the resource.
     */
    variable: VariableState;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ColorMapState


export interface ColorMapState {
    name: string;
    imageData: string;
}

export interface ColorMapCategoryState {
    name: string;
    description: string;
    colorMaps: ColorMapState[];
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CommunicationState

/**
 * Communication state is the status of any not-yet-complete requests to other services.
 */
export interface CommunicationState {
    webAPIStatus: 'connecting'|'open'|'error'|'closed'|null;

    // A map that stores the current state of any tasks (e.g. data fetch jobs from remote API) given a jobId
    tasks: {[jobId: number]: TaskState;};
}

export interface TaskState {
    title?: string;
    status: JobStatus;
    failure?: JobFailure;
    progress?: JobProgress;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ControlState

export type SavedVariableLayers = {[key: string]: VariableImageLayerState|VariableVectorLayerState};

/**
 * Control State is state which is specific to a given container component, and which is not stored in the screen’s
 * URL or in the HTML5 History API.
 */
export interface ControlState {
    // DataSourcesPanel
    selectedDataStoreId: string|null;
    selectedDataSourceId: string|null;
    dataSourceFilterExpr: string;
    showDataSourceDetails: boolean;

    // OperationsPanel
    selectedOperationName: string|null;
    operationFilterTags: string[];
    operationFilterExpr: string;
    showOperationDetails: boolean;

    // WorkspacePanel
    showResourceDetails: boolean;
    selectedWorkspaceResourceId: string|null;
    showWorkflowStepDetails: boolean;
    selectedWorkflowStepId: string|null;

    // VariablesPanel
    selectedVariableName: string|null;
    showVariableDetails: boolean;

    // LayersPanel
    showLayerDetails: boolean;
    savedLayers: SavedVariableLayers;

    // A map that stores the last state of any dialog given a dialogId
    dialogs: {[dialogId: string]: DialogState};

    // TODO (forman): Move view properties into workspace so they can be stored.
    // Take care, workspace objects come from Python back-end, therefore must preserve view settings.
    viewLayout: ViewLayoutState;
    views: ViewState<any>[];
    activeViewId: string | null;
}

export interface DialogState {
    isOpen?: boolean;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SessionState


/**
 * Backend-configuration settings.
 */
export interface BackendConfigState {
    dataStoresPath: string;
    useWorkspaceImageryCache: boolean;
}

/**
 * Session state contains information about the human being which is currently using Cate.
 * Session state is only ever read when a component is mounted.
 * Session state can be used to save preferences.
 */
export interface SessionState {
    lastDir?: string;
    mainWindowBounds?: {x: number; y: number; width: number; height: number};
    devToolsOpened?: boolean;
    /**
     * lastWorkspacePath != null, only if it is not a scratch-workspace
     */
    lastWorkspacePath?: string;
    reopenLastWorkspace?: boolean;
    resourceNamePrefix: string;
    offlineMode: boolean;
    showSelectedVariableLayer: boolean;

    // ApplicationPage
    panelContainerUndockedMode: boolean;
    leftPanelContainerLayout: PanelContainerLayout;
    rightPanelContainerLayout: PanelContainerLayout;
    selectedLeftTopPanelId: string|null;
    selectedLeftBottomPanelId: string|null;
    selectedRightTopPanelId: string|null;
    selectedRightBottomPanelId: string|null;

    /**
     * backendConfig settings are applied on restart (of the WebAPI) only.
     */
    backendConfig: BackendConfigState;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LocationState

/**
 * Location state is the information stored in the URL and the HTML5 History state object.
 */
export interface LocationState {
}
