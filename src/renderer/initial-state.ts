import {DataState, LocationState, SessionState, CommunicationState, ControlState, WorldViewDataState} from './state';
import {newWorldView, hasWebGL, MY_PLACES_LAYER} from "./state-util";
import {SimpleStyle} from "../common/geojson-simple-style";
import {ViewState} from "./components/ViewState";

export const INITIAL_DATA_STATE: DataState = {
    appConfig: {
        webAPIConfig: {
            servicePort: -1,
            serviceAddress: '',
            restUrl: '',
            apiWebSocketUrl: '',
            mplWebSocketUrl: '',
        },
        webAPIClient: null,
        hasWebGL: hasWebGL(),
    },
    dataStores: null,
    operations: null,
    workspace: null,
    colorMaps: null
};

const INITIAL_WORLD_VIEW: ViewState<WorldViewDataState> = newWorldView();

export const INITIAL_CONTROL_STATE: ControlState = {
    selectedWorkflowStepId: null,
    selectedWorkspaceResourceName: null,
    selectedVariableName: null,
    dialogs: {},

    views: [INITIAL_WORLD_VIEW],
    viewLayout: {
        viewIds: [INITIAL_WORLD_VIEW.id],
        selectedViewId: INITIAL_WORLD_VIEW.id,
    },
    activeViewId: INITIAL_WORLD_VIEW.id,

    newPlacemarkToolType: "NoTool",
    entityUpdateCount: 0,
};

export const INITIAL_SESSION_STATE: SessionState = {
    reopenLastWorkspace: false,
    lastWorkspacePath: null,
    autoUpdateSoftware: true,
    autoShowNewFigures: true,
    offlineMode: false,
    showSelectedVariableLayer: true,
    savedLayers: {},

    selectedDataStoreId: null,
    selectedDataSourceId: null,
    dataSourceFilterExpr: '',
    selectedOperationName: null,
    operationFilterTags: [],
    operationFilterExpr: '',

    showDataSourceDetails: true,
    showResourceDetails: true,
    showWorkflowStepDetails: true,
    showOperationDetails: true,
    showVariableDetails: true,
    showLayerDetails: true,

    panelContainerUndockedMode: false,
    leftPanelContainerLayout: {horPos: 300, verPos: 400},
    rightPanelContainerLayout: {horPos: 300, verPos: 400},
    selectedLeftTopPanelId: 'dataSources',
    selectedLeftBottomPanelId: 'operations',
    selectedRightTopPanelId: 'workspace',
    selectedRightBottomPanelId: 'variables',
    placemarkCollection: {
        type: 'FeatureCollection',
        features: []
    },
    selectedPlacemarkId: null,
    showPlacemarkDetails: true,
    defaultPlacemarkStyle: {...MY_PLACES_LAYER.style} as SimpleStyle,

    workspacePanelMode: 'steps',

    showDataSourceTitles: true,
    showLayerTextOverlay: true,
    debugWorldView: false,
    styleContext: "entity",

    backendConfig: {
        dataStoresPath: null,
        useWorkspaceImageryCache: false,
        resourceNamePattern: 'res_{index}',
    },
};

export const INITIAL_COMMUNICATION_STATE: CommunicationState = {
    webAPIStatus: null,
    tasks: {}
};

export const INITIAL_LOCATION_STATE: LocationState = {
    globeMousePosition: null,
    globeViewPosition: null,
};

