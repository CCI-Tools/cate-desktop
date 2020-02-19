import {
    DataState, LocationState, SessionState, CommunicationState, ControlState, WorldViewDataState,
    STYLE_CONTEXT_ENTITY
} from './state';
import { newWorldView, hasWebGL, MY_PLACES_LAYER } from './state-util';
import { SimpleStyle } from '../common/geojson-simple-style';
import { ViewState } from './components/ViewState';

export const INITIAL_DATA_STATE: DataState = {
    appConfig: {
        webAPIMode: null,
        webAPIConfig: {
            servicePort: null,
            serviceAddress: '',
            serviceProtocol: 'http',
        },
        hasWebGL: hasWebGL(),
    },
    dataStores: null,
    operations: null,
    workspace: null,
    colorMaps: null,
    workspaceNames: null
};

const INITIAL_WORLD_VIEW: ViewState<WorldViewDataState> = newWorldView();

export const INITIAL_CONTROL_STATE: ControlState = {
    selectedWorkflowStepId: null,
    selectedWorkspaceResourceName: null,
    selectedVariableName: null,
    dialogs: {},

    selectedCtxOperationName: null,

    views: [INITIAL_WORLD_VIEW],
    viewLayout: {
        viewIds: [INITIAL_WORLD_VIEW.id],
        selectedViewId: INITIAL_WORLD_VIEW.id,
    },
    activeViewId: INITIAL_WORLD_VIEW.id,

    newPlacemarkToolType: 'NoTool',
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

    dataSourceListHeight: 200,
    showDataSourceDetails: true,
    resourceListHeight: 100,
    showResourceDetails: true,
    workflowStepListHeight: 100,
    showWorkflowStepDetails: true,
    operationListHeight: 200,
    showOperationDetails: true,
    variableListHeight: 200,
    showVariableDetails: true,
    layerListHeight: 160,
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
    placemarkListHeight: 160,
    showPlacemarkDetails: true,
    defaultPlacemarkStyle: {...MY_PLACES_LAYER.style} as SimpleStyle,

    workspacePanelMode: 'steps',

    showDataStoreDescription: false,
    showDataStoreNotices: true,
    showDataSourceIdsOnly: false,

    showLayerTextOverlay: true,
    debugWorldView: false,
    styleContext: STYLE_CONTEXT_ENTITY,

    backendConfig: {
        dataStoresPath: null,
        useWorkspaceImageryCache: false,
        resourceNamePattern: 'res_{index}',
        proxyUrl: null,
    },
};

export const INITIAL_COMMUNICATION_STATE: CommunicationState = {
    webAPIStatus: null,
    webAPIClient: null,
    tasks: {},
    username: 'norman',
    password: 'reddogisabluecat',
    // username: process.env.REACT_APP_CATE_USERNAME || null,
    // password: process.env.REACT_APP_CATE_PASSWORD || null,
    token: null,
};

export const INITIAL_LOCATION_STATE: LocationState = {
    globeMousePosition: null,
    globeViewPosition: null,
    positionData: null,
};

