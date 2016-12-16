import  {WebAPIClient} from './webapi';
import {JobStatus, JobFailure, JobProgress} from "./webapi/Job";

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
    dataStores: Array<DataStoreState> | null;
    operations: Array<OperationState> | null;
    workspace: WorkspaceState | null;
}

export interface AppConfigState {
    // TODO (nf): I don't like the webAPIClient here in the state object.
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
    dataSources?: Array<DataSourceState> | null;
}

export interface DataSourceState {
    id: string;
    name: string;
    meta_info: any | null;
}

export interface OperationState {
    name: string;
    description?: string|null;
    tags?: Array<string>|null;
    inputs: Array<OperationInputState>;
    outputs: Array<OperationOutputState>;
}

export interface OperationInputState {
    name: string;
    dataType: string;
    defaultValue?: any;
    description?: string|null;
    valueSet?: Array<any>;
    valueRange?: Array<any>;
}

export interface OperationOutputState {
    name: string;
    dataType: string;
    description?: string|null;
}

export interface WorkspaceState {
    baseDir: string;
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
    workflow: WorkflowState;
    /**
     * Information about the resources
     */
    resources: Array<ResourceState>;
}

export interface WorkflowState {
    steps: Array<WorkflowStepState>;
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
     * For example, 'action' is the operation's name, if typoe==="operation".
     */
    action: any;
    inputs: Array<WorkflowPortState>;
    outputs: Array<WorkflowPortState>;
}

/**
 * See cate-core/cate/core/workspace.py, class NodePort
 */
export interface WorkflowPortState {
    /**
     * Name of the port.
     */
    name: string;
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
    sourceRef: string|null;
}
export interface ResourceState {
    name: string;
    variables : Array<VariableState>;
}

export interface VariableState {
    name : string;
    unit: string;
    dataType: string;
    shape: number[];
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CommunicationState

/**
 * Communication state is the status of any not-yet-complete requests to other services.
 */
export interface CommunicationState {
    webAPIStatus: 'connecting'|'open'|'error'|'closed'|null;

    // A map that stores the current state of any tasks (e.g. data fetch jobs from remote API) given a taskId
    tasks: {[taskId: string]: TaskState;};
}

export interface TaskState {
    status: JobStatus;
    failure?: JobFailure;
    progress?: JobProgress;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ControlState

/**
 * Control State is state which is specific to a given container component, and which is not stored in the screen’s
 * URL or in the HTML5 History API.
 */
export interface ControlState {
    // DataSourcesPanel
    selectedDataStoreId: string|null;
    selectedDataSourceId: string|null;
    showDataSourceDetails: boolean;

    // OperationsPanel
    selectedOperationName: string|null;
    operationFilterTags: Array<string>;
    operationFilterExpr: string;
    showOperationDetails: boolean;

    // WorkspacePanel
    selectedWorkflowStepId: string|null;
    selectedWorkspaceResourceId: string|null;

    // VariablesPanel
    selectedResourceVariableId: string|null;

    // A map that stores the last state of any dialog given a dialogId
    dialogs: {[dialogId: string]: DialogState;};
}

export interface DialogState {
    isOpen?: boolean;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SessionState

/**
 * Session state contains information about the human being which is currently using Cate.
 * Session state is only ever read when a component is mounted.
 * Session state can be used to save preferences.
 */
export interface SessionState {
    lastDir?: string;
    mainWindowBounds?: {x: number; y: number; width: number; height: number};
    devToolsOpened?: boolean;
    lastWorkspacePath?: string,
    openLastWorkspace?: boolean,
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LocationState

/**
 * Location state is the information stored in the URL and the HTML5 History state object.
 */
export interface LocationState {
}
