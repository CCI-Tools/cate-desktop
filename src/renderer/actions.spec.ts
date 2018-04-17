import {createStore, applyMiddleware} from 'redux';
import * as actions from './actions';
import {stateReducer} from './reducers';
import thunk from 'redux-thunk'
import {LayerState, OperationState, Placemark, ResourceState, SPLIT_MODE_OFF, State, VariableState} from "./state";
import {should, expect} from 'chai';
import {
    AUTO_LAYER_ID, COUNTRIES_LAYER_ID, MY_PLACES_LAYER_ID, EXTERNAL_OBJECT_STORE,
    MY_PLACES_LAYER, COUNTRIES_LAYER, AUTO_LAYER
} from "./state-util";
import {DATA_ARRAY_TYPE, DATASET_LIKE_TYPE, POINT_LIKE_TYPE, VAR_NAME_LIKE_TYPE} from "../common/cate-types";
import {InputAssignments} from "./containers/editor/value-editor-assign";
import {NEW_CTX_OPERATION_STEP_DIALOG_ID} from "./containers/operation-step-dialog-ids";

should();

describe('Actions', () => {
    let store = null;

    const getState = (): State => {
        return store.getState();
    };

    const getActiveView = () => {
        return getState().control.views[0];
    };

    const getActiveViewId = () => {
        return getState().control.views[0].id;
    };

    const dispatch = (action: any): void => {
        store.dispatch(action);
    };

    const defaultAutoLayer = {...AUTO_LAYER};
    const defaultCountriesLayer = {...COUNTRIES_LAYER};
    const defaultMyPlacesLayer = {...MY_PLACES_LAYER};

    beforeEach(function () {
        const middleware = applyMiddleware(thunk);
        store = createStore(stateReducer, middleware);
    });

    describe('Initial state', () => {
        it('One single view is defined', () => {
            expect(getState().control.views).to.not.be.null;
            expect(getState().control.views).to.not.be.undefined;
            expect(getState().control.views.length).to.equal(1);
            expect(getState().control.views[0].id.startsWith("world-")).to.be.true;
        });
    });

    describe('Session/Preferences actions', () => {

        it('updatePreferences', () => {
            dispatch(actions.updatePreferences({lastWorkspacePath: 'a/b'}));
            expect(getState().session.lastWorkspacePath).to.deep.equal('a/b');
            dispatch(actions.updatePreferences({lastVar: 'c'}));
            expect(getState().session.lastWorkspacePath).to.deep.equal('a/b');
            expect((getState().session as any).lastVar).to.deep.equal('c');
        });

        it('updateBackendConfig', () => {
            dispatch(actions.updateBackendConfig(
                {
                    dataStoresPath: '/a/b/c',
                    useWorkspaceImageryCache: false,
                    resourceNamePattern: 'var_{index}',
                    proxyUrl: 'http://user:password@host:port'
                }));
            expect(getState().session.backendConfig).to.deep.equal(
                {
                    dataStoresPath: '/a/b/c',
                    useWorkspaceImageryCache: false,
                    resourceNamePattern: 'var_{index}',
                    proxyUrl: 'http://user:password@host:port'
                });
        });
    });

    describe('DataStores actions', () => {

        it('updateDataStores', () => {
            dispatch(actions.updateDataStores(
                [
                    {id: 'local-1'},
                    {id: 'local-2'}
                ] as any));
            expect(getState().data.dataStores).to.deep.equal(
                [
                    {id: 'local-1'},
                    {id: 'local-2'}
                ]);
        });

        it('updateDataSources', () => {
            dispatch(actions.updateDataStores(
                [
                    {id: 'local-1'},
                    {id: 'local-2'}
                ] as any));
            dispatch(actions.updateDataSources('local-2',
                                               [
                                                   {id: 'fileset-1'},
                                                   {id: 'fileset-2'}
                                               ] as any));
            expect(getState().data.dataStores).to.deep.equal(
                [
                    {id: 'local-1'},
                    {
                        id: 'local-2', dataSources: [
                            {id: 'fileset-1'},
                            {id: 'fileset-2'}
                        ]
                    }
                ]);
        });

        it('updateDataSourceTemporalCoverage', () => {
            dispatch(actions.updateDataStores(
                [
                    {id: 'local-1'},
                    {id: 'local-2'}
                ] as any));
            dispatch(actions.updateDataSources('local-2',
                                               [
                                                   {id: 'fileset-1'},
                                                   {id: 'fileset-2'}
                                               ] as any));
            dispatch(actions.updateDataSourceTemporalCoverage('local-2',
                                                              'fileset-1',
                                                              ['2010-01-01', '2014-12-30']));
            expect(getState().data.dataStores).to.deep.equal(
                [
                    {id: 'local-1'},
                    {
                        id: 'local-2', dataSources: [
                            {
                                id: 'fileset-1',
                                temporalCoverage: ['2010-01-01', '2014-12-30']
                            },
                            {id: 'fileset-2'}
                        ]
                    }
                ]);
        });

        it('setSelectedDataStoreId', () => {
            dispatch(actions.updateDataStores(
                [
                    {id: 'local-1', dataSources: []},
                    {id: 'local-2', dataSources: []}
                ] as any));
            dispatch(actions.setSelectedDataStoreId('local-2'));
            expect(getState().session.selectedDataStoreId).to.equal('local-2');
            dispatch(actions.setSelectedDataStoreId(null));
            expect(getState().session.selectedDataStoreId).to.be.null;
        });

        it('setSelectedDataSourceId', () => {
            dispatch(actions.setSelectedDataSourceId('ds-1'));
            expect(getState().session.selectedDataSourceId).to.equal('ds-1');
            dispatch(actions.setSelectedDataSourceId(null));
            expect(getState().session.selectedDataSourceId).to.be.null;
        });

        it('setDataSourceFilterExpr', () => {
            dispatch(actions.setDataSourceFilterExpr('oz mon'));
            expect(getState().session.dataSourceFilterExpr).to.equal('oz mon');
            dispatch(actions.setDataSourceFilterExpr(null));
            expect(getState().session.dataSourceFilterExpr).to.be.null;
        });
    });

    describe('Operations actions', () => {

        it('updateOperations', () => {
            dispatch(actions.updateOperations(
                [
                    {name: 'op-1'},
                    {name: 'op-2'}
                ] as any));
            expect(getState().data.operations).to.deep.equal(
                [
                    {name: 'op-1'},
                    {name: 'op-2'}
                ]);
        });

        it('setSelectedOperationName', () => {
            dispatch(actions.setSelectedOperationName('op-2'));
            expect(getState().session.selectedOperationName).to.equal('op-2');
            dispatch(actions.setSelectedOperationName(null));
            expect(getState().session.selectedOperationName).to.be.null;
        });

        it('setOperationFilterTags', () => {
            dispatch(actions.setOperationFilterTags(['a', 'b']));
            expect(getState().session.operationFilterTags).to.deep.equal(['a', 'b']);
            dispatch(actions.setOperationFilterTags(null));
            expect(getState().session.operationFilterTags).to.be.null;
        });

        it('setOperationFilterExpr', () => {
            dispatch(actions.setOperationFilterExpr('read wri'));
            expect(getState().session.operationFilterExpr).to.equal('read wri');
            dispatch(actions.setOperationFilterExpr(null));
            expect(getState().session.operationFilterExpr).to.be.null;
        });
    });

    describe('Workspace actions', () => {

        it('setCurrentWorkspace - scratch', () => {
            dispatch(actions.setCurrentWorkspace(
                {
                    baseDir: '/1/2/3',
                    isScratch: true,
                } as any));
            expect(getState().data.workspace).to.deep.equal(
                {
                    baseDir: '/1/2/3',
                    isScratch: true,
                });
            expect(getState().session.lastWorkspacePath).to.be.null;
        });

        it('setCurrentWorkspace - non-scratch', () => {
            dispatch(actions.setCurrentWorkspace({
                                                     baseDir: '/uh/oh/ah',
                                                     isScratch: false,
                                                 } as any));
            expect(getState().data.workspace).to.deep.equal({
                                                                baseDir: '/uh/oh/ah',
                                                                isScratch: false,
                                                            });
            expect(getState().session.lastWorkspacePath).to.equal('/uh/oh/ah');
        });

        it('setSelectedWorkspaceResourceName - w/o variables', () => {
            dispatch(actions.setCurrentWorkspace(
                {
                    baseDir: '/uh/oh/ah',
                    isScratch: false,
                    resources: [
                        {name: 'res_1', variables: []},
                        {name: 'res_2', variables: []}
                    ]
                } as any));
            dispatch(actions.setSelectedWorkspaceResourceName('res_2'));
            expect(getState().control.selectedWorkspaceResourceName).to.equal('res_2');
            expect(getState().control.selectedVariableName).to.be.null;
        });

        it('setSelectedWorkspaceResourceName - with variables', () => {
            dispatch(actions.setCurrentWorkspace(
                {
                    baseDir: '/uh/oh/ah',
                    isScratch: false,
                    resources: [
                        {name: 'res_1', variables: [{name: 'var_a'}, {name: 'var_b'}]},
                        {name: 'res_2', variables: [{name: 'var_1'}, {name: 'var_2', isDefault: true}, {name: 'var_3'}]}
                    ]
                } as any));
            dispatch(actions.setSelectedWorkspaceResourceName('res_2'));
            expect(getState().control.selectedWorkspaceResourceName).to.equal('res_2');
            expect(getState().control.selectedVariableName).to.equal('var_2');
            dispatch(actions.setSelectedWorkspaceResourceName('res_1'));
            expect(getState().control.selectedWorkspaceResourceName).to.equal('res_1');
            expect(getState().control.selectedVariableName).to.equal('var_a');
        });

        it('setSelectedWorkflowStepId', () => {
            dispatch(actions.setSelectedWorkflowStepId('res_2'));
            expect(getState().control.selectedWorkflowStepId).to.equal('res_2');
            dispatch(actions.setSelectedWorkflowStepId(null));
            expect(getState().control.selectedWorkflowStepId).to.be.null;
        });

        it('setSelectedVariable', () => {
            const var3 = {name: 'var_3'} as VariableState;
            const res1 = {name: 'res_1', variables: [{name: 'var_1'}, {name: 'var_2'}, var3]} as ResourceState;
            dispatch(actions.setCurrentWorkspace(
                {
                    baseDir: '/uh/oh/ah',
                    isScratch: false,
                    resources: [res1]
                } as any));
            dispatch(actions.setSelectedVariable(res1, var3));
            expect(getState().control.selectedVariableName).to.equal('var_3');
            dispatch(actions.setSelectedVariable(null, null));
            expect(getState().control.selectedVariableName).to.be.null;
        });
    });

    describe('Layer actions', () => {

        const workspace = {
            baseDir: 'a/b/c',
            workflow: {steps: []},
            resources: [
                {
                    name: 'res_1',
                    dataType: 'xarray.core.dataset.Dataset',
                    id: 0,
                    updateCount: 1,
                    variables: [
                        {
                            name: 'analysed_sst',
                            dataType: 'float',
                            numDims: 3,
                            dimNames: ['time', 'lat', 'lon'],
                            validMin: 270,
                            validMax: 310,
                            imageLayout: {
                                numLevels: 1,
                                numLevelZeroTilesX: 1,
                                numLevelZeroTilesY: 1,
                                tileWidth: 200,
                                tileHeight: 100,
                            }
                        },
                        {
                            name: 'sst_error',
                            dataType: 'float',
                            numDims: 3,
                            dimNames: ['time', 'lat', 'lon'],
                            validMin: undefined,
                            validMax: undefined,
                            imageLayout: {
                                numLevels: 1,
                                numLevelZeroTilesX: 1,
                                numLevelZeroTilesY: 1,
                                tileWidth: 200,
                                tileHeight: 100,
                            }
                        },
                        {
                            name: 'profile',
                            dataType: 'float',
                            numDims: 1,
                            dimNames: ['depth']
                        }
                    ]
                }
            ]
        };

        function getRes(): ResourceState {
            return workspace.resources[0] as ResourceState;
        }

        function getVar(name): VariableState | null {
            return workspace.resources[0].variables.find(v => v.name === name);
        }

        it('setSelectedVariable - with image variable', () => {
            dispatch(actions.setCurrentWorkspace(workspace as any));
            dispatch(actions.setSelectedWorkspaceResourceName('res_1'));
            dispatch(actions.setSelectedVariable(getRes(), getVar('analysed_sst')));
            expect(getActiveView().data.layers).to.deep.equal(
                [
                    {
                        id: AUTO_LAYER_ID,
                        name: "Auto res_1.analysed_sst",
                        type: "VariableImage",
                        visible: true,
                        resId: 0,
                        resName: "res_1",
                        varName: "analysed_sst",
                        varIndex: [0],
                        colorMapName: "inferno",
                        alphaBlending: false,
                        displayMin: 270,
                        displayMax: 310,
                        opacity: 1,
                        brightness: 1,
                        contrast: 1,
                        gamma: 1,
                        hue: 0,
                        saturation: 1,
                        splitMode: SPLIT_MODE_OFF,
                    },
                    defaultCountriesLayer,
                    defaultMyPlacesLayer
                ]);
        });

        it('setSelectedVariable - with non-image variable selection', () => {
            dispatch(actions.setCurrentWorkspace(workspace as any));
            dispatch(actions.setSelectedWorkspaceResourceName('res_1'));
            dispatch(actions.setSelectedVariable(getRes(), getVar('profile')));
            expect(getActiveView().data.layers).to.deep.equal(
                [
                    {
                        id: AUTO_LAYER_ID,
                        type: "Unknown",
                        name: "Auto profile (not geo-spatial)",
                        visible: true,
                    },
                    defaultCountriesLayer,
                    defaultMyPlacesLayer
                ]);
        });

        it('setSelectedVariable - can restore previous layer state', () => {
            const autoLayerOld = {
                id: AUTO_LAYER_ID,
                type: "VariableImage",
                name: "Auto res_1.analysed_sst",
                visible: true,
                resId: 0,
                resName: "res_1",
                varName: "analysed_sst",
                varIndex: [139],
                colorMapName: "inferno",
                alphaBlending: false,
                displayMin: 270,
                displayMax: 300,
                opacity: 1,
                brightness: 1,
                contrast: 1,
                gamma: 1,
                hue: 0,
                saturation: 1,
                splitMode: SPLIT_MODE_OFF,
            };
            const autoLayerNew = {
                id: AUTO_LAYER_ID,
                type: "VariableImage",
                name: "Auto res_1.sst_error",
                visible: true,
                resId: 0,
                resName: "res_1",
                varName: "sst_error",
                varIndex: [0],
                colorMapName: "inferno",
                alphaBlending: false,
                displayMin: 0,
                displayMax: 1,
                opacity: 1,
                brightness: 1,
                contrast: 1,
                gamma: 1,
                hue: 0,
                saturation: 1,
                splitMode: SPLIT_MODE_OFF,
            };

            dispatch(actions.setCurrentWorkspace(workspace as any));
            dispatch(actions.setSelectedWorkspaceResourceName('res_1'));
            dispatch(actions.setSelectedVariable(getRes(), getVar('analysed_sst'), getState().session.savedLayers));
            const selectedVarLayer = getActiveView().data.layers[0];
            dispatch(actions.updateLayer(getActiveView().id, selectedVarLayer, {
                varIndex: [139],
                displayMax: 300
            } as any));
            expect(getActiveView().data.layers).to.deep.equal([autoLayerOld, defaultCountriesLayer, defaultMyPlacesLayer]);
            dispatch(actions.setSelectedVariable(getRes(), getVar('sst_error'), getState().session.savedLayers));
            expect(getActiveView().data.layers).to.deep.equal([autoLayerNew, defaultCountriesLayer, defaultMyPlacesLayer]);
            dispatch(actions.setSelectedVariable(getRes(), getVar('analysed_sst'), getState().session.savedLayers));
            expect(getActiveView().data.layers).to.deep.equal([autoLayerOld, defaultCountriesLayer, defaultMyPlacesLayer]);
        });

        it('addVariableLayer', () => {
            dispatch(actions.setCurrentWorkspace(workspace as any));
            dispatch(actions.addVariableLayer(getActiveViewId(), getRes(), getVar('analysed_sst'), true));
            expect(getActiveView().data.layers.length).to.equal(4);
            expect(getActiveView().data.layers[0].id).to.equal(AUTO_LAYER_ID);
            expect(getActiveView().data.layers[1]).to.deep.equal(defaultCountriesLayer);
            expect(getActiveView().data.layers[2]).to.deep.equal(defaultMyPlacesLayer);
            expect(getActiveView().data.layers[3].id.startsWith('layer-')).to.be.true;
        });

        it('addLayer', () => {
            dispatch(actions.addLayer(getActiveViewId(), {id: 'layer-2', visible: true} as LayerState, true));
            expect(getActiveView().data.layers).to.deep.equal([
                                                                  defaultAutoLayer,
                                                                  defaultCountriesLayer,
                                                                  defaultMyPlacesLayer,
                                                                  {id: 'layer-2', visible: true},
                                                              ]);
        });

        it('removeLayer', () => {
            dispatch(actions.addLayer(getActiveViewId(), {id: 'layer-1', visible: true} as LayerState, true));
            dispatch(actions.addLayer(getActiveViewId(), {id: 'layer-2', visible: true} as LayerState, false));
            dispatch(actions.removeLayer(getActiveViewId(), 'layer-2'));
            expect(getActiveView().data.layers).to.deep.equal([
                                                                  defaultAutoLayer,
                                                                  defaultCountriesLayer,
                                                                  defaultMyPlacesLayer,
                                                                  {id: 'layer-1', visible: true},
                                                              ]);
        });

        it('updateLayer', () => {
            dispatch(actions.addLayer(getActiveViewId(), {id: 'layer-1', visible: true} as LayerState, false));
            dispatch(actions.addLayer(getActiveViewId(), {id: 'layer-2', visible: true} as LayerState, false));
            dispatch(actions.addLayer(getActiveViewId(), {id: 'layer-3', visible: true} as LayerState, false));
            dispatch(actions.updateLayer(getActiveViewId(), {id: 'layer-2', visible: false} as LayerState));
            expect(getActiveView().data.layers).to.deep.equal([
                                                                  defaultAutoLayer,
                                                                  defaultCountriesLayer,
                                                                  defaultMyPlacesLayer,
                                                                  {id: 'layer-1', visible: true},
                                                                  {id: 'layer-2', visible: false},
                                                                  {id: 'layer-3', visible: true},
                                                              ]);
            dispatch(actions.updateLayer(getActiveViewId(), {id: 'layer-1', name: 'LX'} as LayerState));
            expect(getActiveView().data.layers).to.deep.equal([
                                                                  defaultAutoLayer,
                                                                  defaultCountriesLayer,
                                                                  defaultMyPlacesLayer,
                                                                  {id: 'layer-1', name: 'LX', visible: true},
                                                                  {id: 'layer-2', visible: false},
                                                                  {id: 'layer-3', visible: true},
                                                              ]);
        });

        it('updateLayerStyle', () => {
            dispatch(actions.addLayer(getActiveViewId(), {
                id: 'layer-1',
                visible: true,
                type: "Vector"
            } as LayerState, false));
            expect(getActiveView().data.layers).to.deep.equal([
                                                                  defaultAutoLayer,
                                                                  defaultCountriesLayer,
                                                                  defaultMyPlacesLayer,
                                                                  {id: 'layer-1', visible: true, type: "Vector"},
                                                              ]);
            dispatch(actions.updateLayerStyle(getActiveViewId(), 'layer-1', {fill: "#123456", fillOpacity: 0.4}));
            expect(getActiveView().data.layers).to.deep.equal([
                                                                  defaultAutoLayer,
                                                                  defaultCountriesLayer,
                                                                  defaultMyPlacesLayer,
                                                                  {
                                                                      id: 'layer-1', visible: true, type: "Vector",
                                                                      style: {
                                                                          fill: "#123456", fillOpacity: 0.4
                                                                      }
                                                                  },
                                                              ]);
            dispatch(actions.updateLayerStyle(getActiveViewId(), 'layer-1', {stroke: "#3053FF", strokeOpacity: 0.6}));
            expect(getActiveView().data.layers).to.deep.equal([
                                                                  defaultAutoLayer,
                                                                  defaultCountriesLayer,
                                                                  defaultMyPlacesLayer,
                                                                  {
                                                                      id: 'layer-1',
                                                                      visible: true,
                                                                      type: "Vector",
                                                                      style: {
                                                                          fill: "#123456", fillOpacity: 0.4,
                                                                          stroke: "#3053FF", strokeOpacity: 0.6,
                                                                      }
                                                                  },
                                                              ]);
        });

        it('setShowSelectedVariableLayer', () => {
            dispatch(actions.setShowSelectedVariableLayer(true));
            expect(getState().session.showSelectedVariableLayer).to.equal(true);
            expect(getActiveView().data.layers).to.deep.equal([
                                                                  defaultAutoLayer,
                                                                  defaultCountriesLayer,
                                                                  defaultMyPlacesLayer
                                                              ]);

            dispatch(actions.setShowSelectedVariableLayer(false));
            expect(getState().session.showSelectedVariableLayer).to.equal(false);
            expect(getActiveView().data.layers).to.deep.equal([
                                                                  {
                                                                      id: AUTO_LAYER_ID,
                                                                      visible: false,
                                                                      type: 'Unknown'
                                                                  },
                                                                  defaultCountriesLayer,
                                                                  defaultMyPlacesLayer
                                                              ]);
        });

        it('setSelectedLayerId', () => {
            dispatch(actions.setSelectedLayerId(getActiveViewId(), 'var2'));
            expect(getActiveView().data.selectedLayerId).to.equal('var2');
            dispatch(actions.setSelectedLayerId(getActiveViewId(), null));
            expect(getActiveView().data.selectedLayerId).to.be.null;
        });

        it('updateEntityStyle', () => {
            // Note: this is a rather complex test because updateEntityStyle() need to consider the various
            // places vector styles are stored:
            // 1. state.control.views[i].data.layers[j].entityStyles[k]
            // 2. state.session.placemarkCollection.features[i].properties
            //
            // We also need a rather complex test setup to simulate a Cesium component.

            // Cesium.EntityCollection mock
            class EntityCollection {
                readonly values: any[];

                constructor(values: any[]) {
                    this.values = values;
                }

                // noinspection JSUnusedGlobalSymbols
                get(i: number) {
                    return this.values[i];
                }

                // noinspection JSUnusedGlobalSymbols
                contains(entity) {
                    return this.values.indexOf(entity) >= 0;
                }
            }

            // Cesium.DataSource mock
            class DataSource {
                readonly entities: EntityCollection;

                constructor(entities: any[]) {
                    this.entities = new EntityCollection(entities);
                }
            }

            // Cesium.DataSourceCollection mock
            class DataSourceCollection {
                readonly length: number;
                private dataSources: DataSource[];

                constructor(dataSources: DataSource[]) {
                    this.dataSources = dataSources;
                    this.length = dataSources.length;
                }

                get(i: number) {
                    return this.dataSources[i];
                }
            }

            // Some user layer
            const layer1 = {
                id: 'user-layer-1',
                visible: true,
                type: "Vector"
            };

            // Prepare test scenario with one user layer and one placemark
            dispatch(actions.setCurrentWorkspace(workspace as any));
            dispatch(actions.addLayer(getActiveViewId(), layer1 as LayerState, false));
            const placemark = {
                type: "Feature",
                id: "pippo",
                geometry: {
                    type: "Point",
                    coordinates: [11.8, 8.4]
                },
                properties: {visible: true}
            };
            dispatch(actions.addPlacemark(placemark as Placemark));
            const placemarkId = getState().session.placemarkCollection.features[0].id;
            const expectedPlacemark = {
                ...placemark, properties: {
                    visible: true,
                    title: "Point 1",
                    "marker-symbol": "1",
                }
            };
            expect(getState().session.placemarkCollection.features[0]).to.deep.equal(expectedPlacemark);

            // Cesium entity mocks for Country layer
            let entity1 = {
                id: "438",
            };
            let entity2 = {
                id: "439",
            };

            // Cesium entity mock for Placemarks layer
            let entity3 = {
                id: placemarkId,
            };

            // Cesium entity mocks for user layer
            let entity4 = {
                id: 9843,
            };
            let entity5 = {
                id: 9843,
            };

            // Cesium.DataSource mock instances
            const countriesDataSource = new DataSource([entity1, entity2]);
            const myPlacesDataSource = new DataSource([entity3]);
            const userDataSource = new DataSource([entity4, entity5]);

            // Cesium.Viewer mock instance
            const cesiumViewer = {
                dataSources: new DataSourceCollection([countriesDataSource, myPlacesDataSource, userDataSource]),
            };

            // ExternalObjectComponent state mock instance
            // noinspection UnnecessaryLocalVariableJS
            const externalObject = {
                object: cesiumViewer,
                state: {
                    dataSourceMap: {
                        [COUNTRIES_LAYER_ID]: countriesDataSource,
                        [MY_PLACES_LAYER_ID]: myPlacesDataSource,
                        "user-layer-1": userDataSource,
                    }
                },
            };

            // Register our Cesium.Viewer mock instance
            EXTERNAL_OBJECT_STORE["CesiumGlobe-" + getActiveViewId()] = externalObject;

            const countriesLayerIndex = 1;
            const myPlacesLayerIndex = 2;
            const userLayerIndex = 3;

            let countryLayer = getActiveView().data.layers[countriesLayerIndex];
            let myPlacesLayer = getActiveView().data.layers[myPlacesLayerIndex];
            let userLayer = getActiveView().data.layers[userLayerIndex];

            expect(countryLayer.id).to.equal(COUNTRIES_LAYER_ID);
            expect(myPlacesLayer.id).to.equal(MY_PLACES_LAYER_ID);
            expect(userLayer.id).to.equal("user-layer-1");

            expect(countryLayer.entityStyles).to.not.exist;
            expect(myPlacesLayer.entityStyles).to.not.exist;
            expect(userLayer.entityStyles).to.not.exist;

            // Style change on entity of Countries layer --> change in countryLayer.entityStyles
            //
            dispatch(actions.updateEntityStyle(getActiveView(), entity1, {
                fill: "#123456",
                fillOpacity: 0.3,
            }));

            countryLayer = getActiveView().data.layers[countriesLayerIndex];
            expect(countryLayer.entityStyles).to.exist;
            expect(countryLayer.entityStyles[entity1.id]).to.exist;
            expect(countryLayer.entityStyles[entity1.id]).to.deep.equal({
                                                                            fill: "#123456",
                                                                            fillOpacity: 0.3,
                                                                        });

            // Another style change on entity of Countries layer--> change in countryLayer.entityStyles
            //
            dispatch(actions.updateEntityStyle(getActiveView(), entity1, {
                stroke: "#615243",
                strokeOpacity: 0.9,
            }));

            countryLayer = getActiveView().data.layers[countriesLayerIndex];
            expect(countryLayer.entityStyles[entity1.id]).to.deep.equal({
                                                                            fill: "#123456",
                                                                            fillOpacity: 0.3,
                                                                            stroke: "#615243",
                                                                            strokeOpacity: 0.9,
                                                                        });

            // Yet another style change on another entity of Countries layer --> change in countryLayer.entityStyles
            //
            dispatch(actions.updateEntityStyle(getActiveView(), entity2, {
                fill: "#112233",
                fillOpacity: 0.4,
            }));

            countryLayer = getActiveView().data.layers[countriesLayerIndex];
            expect(countryLayer.entityStyles[entity1.id]).to.deep.equal({
                                                                            fill: "#123456",
                                                                            fillOpacity: 0.3,
                                                                            stroke: "#615243",
                                                                            strokeOpacity: 0.9,
                                                                        });
            expect(countryLayer.entityStyles[entity2.id]).to.deep.equal({
                                                                            fill: "#112233",
                                                                            fillOpacity: 0.4,
                                                                        });

            // Style change on a placemark entity --> change in state.session.placemarkCollection
            //
            dispatch(actions.updateEntityStyle(getActiveView(), entity3, {
                markerSize: "large",
                markerSymbol: "bus",
            }));

            myPlacesLayer = getActiveView().data.layers[myPlacesLayerIndex];
            expect(myPlacesLayer.entityStyles).to.not.exist; // placemark styles go into feature properties
            expect(getState().session.placemarkCollection.features[0]).to.deep.equal({
                                                                                         ...expectedPlacemark,
                                                                                         properties: {
                                                                                             ...expectedPlacemark.properties,
                                                                                             "marker-size": "large",
                                                                                             "marker-symbol": "bus",
                                                                                         }
                                                                                     });

            // Style change on a user entity --> change in userLayer.entityStyles
            //
            dispatch(actions.updateEntityStyle(getActiveView(), entity5, {
                fill: "#FF00FF",
                fillOpacity: 0.21,
            }));

            userLayer = getActiveView().data.layers[userLayerIndex];
            expect(userLayer.entityStyles[entity5.id]).to.deep.equal({
                                                                         fill: "#FF00FF",
                                                                         fillOpacity: 0.21,
                                                                     });
        });
    });

    describe('Feature actions', () => {

        it('updatePlacemarkStyle', () => {
            const placemark = {
                type: "Feature",
                id: "pippo",
                geometry: {
                    type: "Point",
                    coordinates: [12.6, 53.1]
                },
                properties: {visible: true}
            } as Placemark;
            dispatch(actions.addPlacemark(placemark));
            expect(getState().session.placemarkCollection).to.exist;
            expect(getState().session.placemarkCollection.features.length).to.equal(1);
            expect(getState().session.placemarkCollection.features[0]).to.deep.equal({
                                                                                         ...placemark,
                                                                                         properties: {
                                                                                             visible: true,
                                                                                             title: "Point 1",
                                                                                             "marker-symbol": "1",
                                                                                         }
                                                                                     });
            dispatch(actions.updatePlacemarkStyle(placemark.id, {title: "Bibo"}));
            expect(getState().session.placemarkCollection.features[0]).to.deep.equal({
                                                                                         ...placemark,
                                                                                         properties: {
                                                                                             visible: true,
                                                                                             title: "Bibo",
                                                                                             "marker-symbol": "1",
                                                                                         }
                                                                                     });
            dispatch(actions.updatePlacemarkStyle(placemark.id, {markerSymbol: "bus"}));
            expect(getState().session.placemarkCollection.features[0]).to.deep.equal({
                                                                                         ...placemark,
                                                                                         properties: {
                                                                                             visible: true,
                                                                                             title: "Bibo",
                                                                                             "marker-symbol": "bus",
                                                                                         }
                                                                                     });
        });

        it('updatePlacemarkGeometry', () => {
            const placemark = {
                type: "Feature",
                id: "pippo",
                geometry: {
                    type: "Point",
                    coordinates: [12.6, 53.1]
                },
                properties: {}
            } as Placemark;
            dispatch(actions.addPlacemark(placemark));
            expect(getState().session.placemarkCollection).to.exist;
            expect(getState().session.placemarkCollection.features.length).to.equal(1);
            let expectedPlacemark = {
                ...placemark,
                properties: {
                    "marker-symbol": "1",
                    "title": "Point 1",
                }
            };
            expect(getState().session.placemarkCollection.features[0]).to.deep.equal(expectedPlacemark);
            dispatch(actions.updatePlacemarkGeometry(placemark.id, {coordinates: [13.2, 53.1]}));
            expect(getState().session.placemarkCollection.features[0]).to.deep.equal({
                                                                                         ...expectedPlacemark,
                                                                                         geometry: {
                                                                                             type: "Point",
                                                                                             coordinates: [13.2, 53.1],
                                                                                         }
                                                                                     });
        });
    });

    describe('Workspace actions involving layers', () => {

        const workspace = {
            baseDir: 'a/b/c',
            workflow: {steps: []},
            resources: [
                {
                    name: 'res_1',
                },
                {
                    name: 'res_2',
                }
            ]
        };

        it('renameWorkspaceResourceImpl', () => {
            dispatch(actions.setCurrentWorkspace(workspace as any));
            dispatch(actions.addLayer(getActiveViewId(), {
                id: 'L1',
                resId: 1,
                resName: 'res_1',
                varName: 'X'
            } as any, false));
            dispatch(actions.addLayer(getActiveViewId(), {
                id: 'L2',
                resId: 2,
                resName: 'res_2',
                varName: 'X'
            } as any, false));
            dispatch(actions.setSelectedWorkspaceResourceName('res_2'));
            dispatch(actions.renameWorkspaceResourceImpl('res_2', 'bert'));
            expect(getActiveView().data.layers).to.deep.equal(
                [
                    {...AUTO_LAYER},
                    {...COUNTRIES_LAYER},
                    {...MY_PLACES_LAYER},
                    {id: 'L1', resId: 1, resName: 'res_1', varName: 'X'},
                    {id: 'L2', resId: 2, resName: 'bert', varName: 'X'},
                ]);
            expect(getState().control.selectedWorkspaceResourceName).to.equal('bert');
        });

    });

    describe('OperationStepDialog actions', () => {

        it('show/hideOperationStepDialog', () => {
            let inputAssignments;
            dispatch(actions.showOperationStepDialog('operationStepDialog'));
            expect(getState().control.dialogs['operationStepDialog']).to.deep.equal(
                {
                    isOpen: true
                });
            dispatch(actions.hideOperationStepDialog('operationStepDialog'));
            //noinspection JSUnusedAssignment
            expect(getState().control.dialogs['operationStepDialog']).to.deep.equal(
                {
                    isOpen: false,
                    inputAssignments
                });
            dispatch(actions.hideOperationStepDialog('operationStepDialog',
                                                     {op1: {a: 3, b: 8}}));
            expect(getState().control.dialogs['operationStepDialog']).to.deep.equal(
                {
                    isOpen: false,
                    inputAssignments: {
                        op1: {a: 3, b: 8}
                    }
                });
            dispatch(actions.hideOperationStepDialog('operationStepDialog',
                                                     {op2: {x: 2, y: 1}}));
            expect(getState().control.dialogs['operationStepDialog']).to.deep.equal(
                {
                    isOpen: false,
                    inputAssignments: {
                        op1: {a: 3, b: 8},
                        op2: {x: 2, y: 1}
                    }
                });
        });
    });

    describe('Dialog actions', () => {

        it('show/hideDialog', () => {
            expect(getState().control.dialogs['myDialog']).to.be.undefined;

            dispatch(actions.showDialog('myDialog'));
            expect(getState().control.dialogs['myDialog']).to.deep.equal({isOpen: true});

            dispatch(actions.hideDialog('myDialog', {a: 4, b: 5}));
            expect(getState().control.dialogs['myDialog']).to.deep.equal({isOpen: false, a: 4, b: 5});
        });
    });


    describe('Context actions', () => {

        it('invokeCtxOperation', () => {
            // Dummy workspace
            dispatch(actions.setCurrentWorkspace(
                {
                    baseDir: '/1/2/3',
                    isScratch: true,
                    resources: [{
                        id: 0,
                        name: "SST_CCI",
                        dataType: DATASET_LIKE_TYPE,
                        variables: [{
                            name: "analysed_sst",
                            dataType: DATA_ARRAY_TYPE,
                        }]
                    }],
                } as any));

            // Dummy operation
            const operation: OperationState = {
                name: "tseries_point",
                qualifiedName: "cate.ops.tseries_point",
                hasMonitor: false,
                inputs: [{
                    name: "ds",
                    dataType: DATASET_LIKE_TYPE,
                    description: null,
                }, {
                    name: "point",
                    dataType: POINT_LIKE_TYPE,
                    description: null,
                }, {
                    name: "var_name",
                    dataType: VAR_NAME_LIKE_TYPE,
                    description: null,
                }],
                outputs: [{
                    name: "return",
                    dataType: DATASET_LIKE_TYPE,
                    description: null,
                }],
                description: "",
                tags: [],
            };

            const inputAssignments: InputAssignments = {
                point: {
                    isValueUsed: true,
                    constantValue: "POINT (12, 53)",
                    resourceName: null,
                }
            };

            let dialogState;

            expect(getState().control.selectedCtxOperationName).to.be.null;
            dialogState = getState().control.dialogs[NEW_CTX_OPERATION_STEP_DIALOG_ID];
            expect(dialogState).to.be.undefined;

            // Dispatch context operation action
            dispatch(actions.invokeCtxOperation(operation, inputAssignments));

            expect(getState().control.selectedCtxOperationName).to.equal("tseries_point");
            dialogState = getState().control.dialogs[NEW_CTX_OPERATION_STEP_DIALOG_ID];
            expect(dialogState).to.deep.equal({
                                                  isOpen: true,
                                                  inputAssignments,
                                              });

            // Close dialog
            dispatch(actions.updateDialogState(NEW_CTX_OPERATION_STEP_DIALOG_ID, {isOpen: false}));
            dialogState = getState().control.dialogs[NEW_CTX_OPERATION_STEP_DIALOG_ID];
            expect(dialogState).to.deep.equal({
                                                  isOpen: false,
                                                  inputAssignments,
                                              });

            // Add some selections
            dispatch(actions.updateControlState({
                                                    selectedWorkspaceResourceName: "SST_CCI",
                                                    selectedVariableName: "analysed_sst"
                                                }));
            // Dispatch context operation action again
            dispatch(actions.invokeCtxOperation(operation, inputAssignments));

            // Expect to see new context in actions
            expect(getState().control.selectedCtxOperationName).to.equal("tseries_point");
            dialogState = getState().control.dialogs[NEW_CTX_OPERATION_STEP_DIALOG_ID];
            expect(dialogState).to.deep.equal({
                                                  isOpen: true,
                                                  inputAssignments: {
                                                      ...inputAssignments,
                                                      ds: {
                                                          isValueUsed: false,
                                                          constantValue: null,
                                                          resourceName: "SST_CCI",
                                                      },
                                                      var_name: {
                                                          isValueUsed: true,
                                                          constantValue: "analysed_sst",
                                                          resourceName: null,
                                                      }
                                                  },
                                              });
        });
    });
});
