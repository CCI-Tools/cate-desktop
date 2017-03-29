import {createStore, applyMiddleware} from 'redux';
import * as actions from './actions';
import {stateReducer} from './reducers';
import thunk from 'redux-thunk'
import {LayerState, State} from "./state";
import {should, expect} from 'chai';
import {SELECTED_VARIABLE_LAYER_ID, COUNTRIES_LAYER_ID} from "./state-util";

should();

describe('Actions', () => {
    let store = null;

    const getState = () : State => {
        return store.getState();
    };

    const dispatch = (action: any): void => {
        store.dispatch(action);
    };

    const defaultSelectedVariableLayer = {
        id: SELECTED_VARIABLE_LAYER_ID,
        type: 'Unknown',
        visible: true,
    };

    const defaultCountriesLayers = {
        id: COUNTRIES_LAYER_ID,
        name: "Countries",
        type: "Vector",
        visible: false,
    };

    beforeEach(function () {
        const middleware = applyMiddleware(thunk);
        store = createStore(stateReducer, middleware);
    });

    describe('Session/Preferences actions', () => {

        it('updatePreferences', () => {
            dispatch(actions.updatePreferences({lastDir: 'a/b'}));
            expect(store.getState().session.lastDir).to.deep.equal('a/b');
            dispatch(actions.updatePreferences({lastVar: 'c'}));
            expect(getState().session.lastDir).to.deep.equal('a/b');
            expect((getState().session as any).lastVar).to.deep.equal('c');
        });

        it('updateBackendConfig', () => {
            dispatch(actions.updateBackendConfig({
                dataStoresPath: '/a/b/c',
                useWorkspaceImageryCache: false
            }));
            expect(getState().session.backendConfig).to.deep.equal({
                dataStoresPath: '/a/b/c',
                useWorkspaceImageryCache: false
            });
        });
    });

    describe('DataStores actions', () => {

        it('updateDataStores', () => {
            dispatch(actions.updateDataStores([
                {id: 'local-1'},
                {id: 'local-2'}
            ] as any));
            expect(getState().data.dataStores).to.deep.equal([
                {id: 'local-1'},
                {id: 'local-2'}
            ]);
        });

        it('updateDataSources', () => {
            dispatch(actions.updateDataStores([
                {id: 'local-1'},
                {id: 'local-2'}
            ] as any));
            dispatch(actions.updateDataSources('local-2', [
                {id: 'fileset-1'},
                {id: 'fileset-2'}
            ] as any));
            expect(getState().data.dataStores).to.deep.equal([
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
            dispatch(actions.updateDataStores([
                {id: 'local-1'},
                {id: 'local-2'}
            ] as any));
            dispatch(actions.updateDataSources('local-2', [
                {id: 'fileset-1'},
                {id: 'fileset-2'}
            ] as any));
            dispatch(actions.updateDataSourceTemporalCoverage('local-2', 'fileset-1', ['2010-01-01', '2014-12-30']));
            expect(getState().data.dataStores).to.deep.equal([
                {id: 'local-1'},
                {
                    id: 'local-2', dataSources: [
                    {id: 'fileset-1', temporalCoverage: ['2010-01-01', '2014-12-30']},
                    {id: 'fileset-2'}
                ]
                }
            ]);
        });

        it('setSelectedDataStoreId', () => {
            dispatch(actions.updateDataStores([
                {id: 'local-1', dataSources: []},
                {id: 'local-2', dataSources: []}
            ] as any));
            dispatch(actions.setSelectedDataStoreId('local-2'));
            expect(getState().control.selectedDataStoreId).to.equal('local-2');
            dispatch(actions.setSelectedDataStoreId(null));
            expect(getState().control.selectedDataStoreId).to.be.null;
        });

        it('setSelectedDataSourceId', () => {
            dispatch(actions.setSelectedDataSourceId('ds-1'));
            expect(getState().control.selectedDataSourceId).to.equal('ds-1');
            dispatch(actions.setSelectedDataSourceId(null));
            expect(getState().control.selectedDataSourceId).to.be.null;
        });

        it('setDataSourceFilterExpr', () => {
            dispatch(actions.setDataSourceFilterExpr('oz mon'));
            expect(getState().control.dataSourceFilterExpr).to.equal('oz mon');
            dispatch(actions.setDataSourceFilterExpr(null));
            expect(getState().control.dataSourceFilterExpr).to.be.null;
        });
    });

    describe('Operations actions', () => {

        it('updateOperations', () => {
            dispatch(actions.updateOperations([
                {name: 'op-1'},
                {name: 'op-2'}
            ] as any));
            expect(getState().data.operations).to.deep.equal([
                {name: 'op-1'},
                {name: 'op-2'}
            ]);
        });

        it('setSelectedOperationName', () => {
            dispatch(actions.setSelectedOperationName('op-2'));
            expect(getState().control.selectedOperationName).to.equal('op-2');
            dispatch(actions.setSelectedOperationName(null));
            expect(getState().control.selectedOperationName).to.be.null;
        });

        it('setOperationFilterTags', () => {
            dispatch(actions.setOperationFilterTags(['a', 'b']));
            expect(getState().control.operationFilterTags).to.deep.equal(['a', 'b']);
            dispatch(actions.setOperationFilterTags(null));
            expect(getState().control.operationFilterTags).to.be.null;
        });

        it('setOperationFilterExpr', () => {
            dispatch(actions.setOperationFilterExpr('read wri'));
            expect(getState().control.operationFilterExpr).to.equal('read wri');
            dispatch(actions.setOperationFilterExpr(null));
            expect(getState().control.operationFilterExpr).to.be.null;
        });
    });

    describe('Workspace actions', () => {

        it('setCurrentWorkspace - scratch', () => {
            dispatch(actions.setCurrentWorkspace({
                baseDir: '/1/2/3',
                isScratch: true,
            } as any));
            expect(getState().data.workspace).to.deep.equal({
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

        it('setSelectedWorkspaceResourceId - w/o variables', () => {
            dispatch(actions.setCurrentWorkspace({
                baseDir: '/uh/oh/ah',
                isScratch: false,
                resources: [
                    {name: 'res_1', variables: []},
                    {name: 'res_2', variables: []}
                ]
            } as any));
            dispatch(actions.setSelectedWorkspaceResourceId('res_2'));
            expect(getState().control.selectedWorkspaceResourceId).to.equal('res_2');
            expect(getState().control.selectedVariableName).to.be.null;
        });

        it('setSelectedWorkspaceResourceId - with variables', () => {
            dispatch(actions.setCurrentWorkspace({
                baseDir: '/uh/oh/ah',
                isScratch: false,
                resources: [
                    {name: 'res_1', variables: []},
                    {name: 'res_2', variables: [{name: 'var_1'}, {name: 'var_2'}]}
                ]
            } as any));
            dispatch(actions.setSelectedWorkspaceResourceId('res_2'));
            expect(getState().control.selectedWorkspaceResourceId).to.equal('res_2');
            expect(getState().control.selectedVariableName).to.equal('var_1');
        });

        it('setSelectedWorkflowStepId', () => {
            dispatch(actions.setSelectedWorkflowStepId('res_2'));
            expect(getState().control.selectedWorkflowStepId).to.equal('res_2');
            dispatch(actions.setSelectedWorkflowStepId(null));
            expect(getState().control.selectedWorkflowStepId).to.be.null;
        });

        it('setSelectedVariableName', () => {
            dispatch(actions.setSelectedVariableName('var_3'));
            expect(getState().control.selectedVariableName).to.equal('var_3');
            dispatch(actions.setSelectedVariableName(null));
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
                    variables: [
                        {
                            name: 'analysed_sst', dataType: 'float', ndim: 3, dimensions: ['time', 'lat', 'lon'],
                            valid_min: 270,
                            valid_max: 310,
                            imageLayout: {
                                numLevels: 1,
                                numLevelZeroTilesX: 1,
                                numLevelZeroTilesY: 1,
                                tileWidth: 200,
                                tileHeight: 100,
                            }
                        },
                        {
                            name: 'sst_error', dataType: 'float', ndim: 3, dimensions: ['time', 'lat', 'lon'],
                            valid_min: null,
                            valid_max: null,
                            imageLayout: {
                                numLevels: 1,
                                numLevelZeroTilesX: 1,
                                numLevelZeroTilesY: 1,
                                tileWidth: 200,
                                tileHeight: 100,
                            }
                        },
                        {
                            name: 'profile', dataType: 'float', ndim: 1, dimensions: ['depth']
                        }
                    ]
                }
            ]
        };


        it('setSelectedVariableName - with image variable', () => {
            dispatch(actions.setCurrentWorkspace(workspace as any));
            dispatch(actions.setSelectedWorkspaceResourceId('res_1'));
            dispatch(actions.setSelectedVariableName('analysed_sst'));
            expect(getState().control.viewer.layers).to.deep.equal([
                {
                    id: SELECTED_VARIABLE_LAYER_ID,
                    type: "VariableImage",
                    visible: true,
                    resName: "res_1",
                    varName: "analysed_sst",
                    varIndex: [0],
                    colorMapName: "jet",
                    alphaBlending: false,
                    displayMin: 270,
                    displayMax: 310,
                    opacity: 1,
                    brightness: 1,
                    contrast: 1,
                    gamma: 1,
                    hue: 0,
                    saturation: 1,
                },
                defaultCountriesLayers
            ]);
        });

        it('setSelectedVariableName - with non-image variable selection', () => {
            dispatch(actions.setCurrentWorkspace(workspace as any));
            dispatch(actions.setSelectedWorkspaceResourceId('res_1'));
            dispatch(actions.setSelectedVariableName('profile'));
            expect(getState().control.viewer.layers).to.deep.equal([
                {
                    id: SELECTED_VARIABLE_LAYER_ID,
                    type: "Unknown",
                    name: "profile of res_1",
                    visible: true,
                },
                defaultCountriesLayers
            ]);
        });

        it('setSelectedVariableName - can restore previous layer state', () => {
            const selectedVariableLayerOld = {
                id: SELECTED_VARIABLE_LAYER_ID,
                type: "VariableImage",
                visible: true,
                resName: "res_1",
                varName: "analysed_sst",
                varIndex: [139],
                colorMapName: "jet",
                alphaBlending: false,
                displayMin: 270,
                displayMax: 300,
                opacity: 1,
                brightness: 1,
                contrast: 1,
                gamma: 1,
                hue: 0,
                saturation: 1,
            };
            const selectedVariableLayerNew = {
                id: SELECTED_VARIABLE_LAYER_ID,
                type: "VariableImage",
                visible: true,
                resName: "res_1",
                varName: "sst_error",
                varIndex: [0],
                colorMapName: "jet",
                alphaBlending: false,
                displayMin: 0,
                displayMax: 1,
                opacity: 1,
                brightness: 1,
                contrast: 1,
                gamma: 1,
                hue: 0,
                saturation: 1,
            };

            dispatch(actions.setCurrentWorkspace(workspace as any));
            dispatch(actions.setSelectedWorkspaceResourceId('res_1'));
            dispatch(actions.setSelectedVariableName('analysed_sst'));
            dispatch(actions.updateLayer({
                id: SELECTED_VARIABLE_LAYER_ID,
                varIndex: [139],
                displayMax: 300
            } as any));
            expect(getState().control.viewer.layers).to.deep.equal([selectedVariableLayerOld, defaultCountriesLayers]);
            dispatch(actions.setSelectedVariableName('sst_error'));
            expect(getState().control.viewer.layers).to.deep.equal([selectedVariableLayerNew, defaultCountriesLayers]);
            dispatch(actions.setSelectedVariableName('analysed_sst'));
            expect(getState().control.viewer.layers).to.deep.equal([selectedVariableLayerOld, defaultCountriesLayers]);
        });

        it('addVariableLayer - w/o variable selection', () => {
            dispatch(actions.setCurrentWorkspace(workspace as any));
            dispatch(actions.addVariableLayer('ID756473'));
            expect(getState().control.viewer.layers).to.deep.equal([
                {
                    id: SELECTED_VARIABLE_LAYER_ID,
                    type: 'Unknown',
                    visible: true,
                },
                defaultCountriesLayers
            ]);
        });

        it('addVariableLayer - with image variable selection', () => {
            dispatch(actions.setCurrentWorkspace(workspace as any));
            dispatch(actions.setSelectedWorkspaceResourceId('res_1'));
            dispatch(actions.setSelectedVariableName('analysed_sst'));
            dispatch(actions.addVariableLayer('ID756473'));
            expect(getState().control.viewer.layers).to.deep.equal([
                {
                    id: SELECTED_VARIABLE_LAYER_ID,
                    type: "VariableImage",
                    visible: true,
                    resName: "res_1",
                    varName: "analysed_sst",
                    varIndex: [0],
                    colorMapName: "jet",
                    alphaBlending: false,
                    displayMin: 270,
                    displayMax: 310,
                    opacity: 1,
                    brightness: 1,
                    contrast: 1,
                    gamma: 1,
                    hue: 0,
                    saturation: 1,
                },
                defaultCountriesLayers,
                {
                    id: "ID756473",
                    type: "VariableImage",
                    visible: true,
                    resName: "res_1",
                    varName: "analysed_sst",
                    varIndex: [0],
                    colorMapName: "jet",
                    alphaBlending: false,
                    displayMin: 270,
                    displayMax: 310,
                    opacity: 1,
                    brightness: 1,
                    contrast: 1,
                    gamma: 1,
                    hue: 0,
                    saturation: 1,
                }
            ]);
        });

        it('addVariableLayer - with non-image variable selection', () => {
            dispatch(actions.setCurrentWorkspace(workspace as any));
            dispatch(actions.setSelectedWorkspaceResourceId('res_1'));
            dispatch(actions.setSelectedVariableName('profile'));
            dispatch(actions.addVariableLayer('ID756473'));
            expect(getState().control.viewer.layers).to.deep.equal([
                {
                    id: SELECTED_VARIABLE_LAYER_ID,
                    type: "Unknown",
                    name: "profile of res_1",
                    visible: true,
                },
                defaultCountriesLayers
            ]);
        });

        it('addLayer', () => {
            dispatch(actions.addLayer({id: 'layer-2', visible: true} as LayerState));
            expect(getState().control.viewer.layers).to.deep.equal([
                defaultSelectedVariableLayer,
                defaultCountriesLayers,
                {id: 'layer-2', visible: true},
            ]);
        });

        it('removeLayer', () => {
            dispatch(actions.addLayer({id: 'layer-1', visible: true} as LayerState));
            dispatch(actions.addLayer({id: 'layer-2', visible: true} as LayerState));
            dispatch(actions.removeLayer('layer-2'));
            expect(getState().control.viewer.layers).to.deep.equal([
                defaultSelectedVariableLayer,
                defaultCountriesLayers,
                {id: 'layer-1', visible: true},
            ]);
        });

        it('updateLayer', () => {
            dispatch(actions.addLayer({id: 'layer-1', visible: true} as LayerState));
            dispatch(actions.addLayer({id: 'layer-2', visible: true} as LayerState));
            dispatch(actions.addLayer({id: 'layer-3', visible: true} as LayerState));
            dispatch(actions.updateLayer({id: 'layer-2', visible: false} as LayerState));
            expect(getState().control.viewer.layers).to.deep.equal([
                defaultSelectedVariableLayer,
                defaultCountriesLayers,
                {id: 'layer-1', visible: true},
                {id: 'layer-2', visible: false},
                {id: 'layer-3', visible: true},
            ]);
            dispatch(actions.updateLayer({id: 'layer-1', name: 'LX'} as LayerState));
            expect(getState().control.viewer.layers).to.deep.equal([
                defaultSelectedVariableLayer,
                defaultCountriesLayers,
                {id: 'layer-1', name: 'LX', visible: true},
                {id: 'layer-2', visible: false},
                {id: 'layer-3', visible: true},
            ]);
        });

        it('setShowSelectedVariableLayer', () => {
            dispatch(actions.setShowSelectedVariableLayer(true));
            expect(getState().session.showSelectedVariableLayer).to.equal(true);
            expect(getState().control.viewer.layers).to.deep.equal([
                defaultSelectedVariableLayer,
                defaultCountriesLayers,
            ]);

            dispatch(actions.setShowSelectedVariableLayer(false));
            expect(getState().session.showSelectedVariableLayer).to.equal(false);
            expect(getState().control.viewer.layers).to.deep.equal([
                {id: SELECTED_VARIABLE_LAYER_ID, visible: false, type: 'Unknown'},
                defaultCountriesLayers,
            ]);
        });

        it('setShowSelectedVariableLayer - setSelectedLayerId', () => {
            dispatch(actions.setSelectedLayerId(SELECTED_VARIABLE_LAYER_ID));

            dispatch(actions.setShowSelectedVariableLayer(true));
            expect(getState().control.selectedLayerId).to.be.equal(SELECTED_VARIABLE_LAYER_ID);

            dispatch(actions.setShowSelectedVariableLayer(false));
            expect(getState().control.selectedLayerId).to.be.null;
        });

        it('setSelectedLayerId', () => {
            dispatch(actions.setSelectedLayerId('var2'));
            expect(getState().control.selectedLayerId).to.equal('var2');
            dispatch(actions.setSelectedLayerId(null));
            expect(getState().control.selectedLayerId).to.be.null;
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
            dispatch(actions.addLayer({id: 'L1', resName: 'res_1', varName: 'X'} as any));
            dispatch(actions.addLayer({id: 'L2', resName: 'res_2', varName: 'X'} as any));
            dispatch(actions.setSelectedWorkspaceResourceId('res_2'));
            dispatch(actions.renameWorkspaceResourceImpl('res_2', 'bert'));
            expect(getState().control.viewer.layers).to.deep.equal([
                {id: SELECTED_VARIABLE_LAYER_ID, visible: true, type: "Unknown"},
                {id: COUNTRIES_LAYER_ID, visible: false, type: "Vector", name: 'Countries'},
                {id: 'L1', resName: 'res_1', varName: 'X'},
                {id: 'L2', resName: 'bert', varName: 'X'},
            ]);
            expect(getState().control.selectedWorkspaceResourceId).to.equal('bert');
        });

    });

    describe('OperationStepDialog actions', () => {

        it('show/hideOperationStepDialog', () => {
            let inputAssignments;
            dispatch(actions.showOperationStepDialog());
            expect(getState().control.dialogs['operationStepDialog']).to.deep.equal({
                isOpen: true
            });
            dispatch(actions.hideOperationStepDialog());
            //noinspection JSUnusedAssignment
            expect(getState().control.dialogs['operationStepDialog']).to.deep.equal({
                isOpen: false,
                inputAssignments
            });
            dispatch(actions.hideOperationStepDialog({op1: {a: 3, b: 8}}));
            expect(getState().control.dialogs['operationStepDialog']).to.deep.equal({
                isOpen: false,
                inputAssignments: {
                    op1: {a: 3, b: 8}
                }
            });
            dispatch(actions.hideOperationStepDialog({op2: {x: 2, y: 1}}));
            expect(getState().control.dialogs['operationStepDialog']).to.deep.equal({
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
});
