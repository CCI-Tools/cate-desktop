import {Store, createStore, applyMiddleware} from 'redux';
import * as actions from './actions';
import {stateReducer} from './reducers';
import thunk from 'redux-thunk'
import {LayerState} from "./state";
import {should, expect} from 'chai';

should();

describe('Actions', () => {
    let store = null;

    beforeEach(function () {
        const middleware = applyMiddleware(thunk);
        store = createStore(stateReducer, middleware);
    });

    describe('Session/Preferences actions', () => {

        it('updatePreferences', () => {
            store.dispatch(actions.updatePreferences({lastDir: 'a/b'}));
            expect(store.getState().session.lastDir).to.deep.equal('a/b');
            store.dispatch(actions.updatePreferences({lastVar: 'c'}));
            expect(store.getState().session.lastDir).to.deep.equal('a/b');
            expect(store.getState().session.lastVar).to.deep.equal('c');
        });

        it('updateBackendConfig', () => {
            store.dispatch(actions.updateBackendConfig({
                dataStoresPath: '/a/b/c',
                useWorkspaceImageryCache: false
            }));
            expect(store.getState().session.backendConfig).to.deep.equal({
                dataStoresPath: '/a/b/c',
                useWorkspaceImageryCache: false
            });
        });
    });

    describe('DataStores actions', () => {

        it('updateDataStores', () => {
            store.dispatch(actions.updateDataStores([
                {id: 'local-1'},
                {id: 'local-2'}
            ] as any));
            expect(store.getState().data.dataStores).to.deep.equal([
                {id: 'local-1'},
                {id: 'local-2'}
            ]);
        });

        it('updateDataSources', () => {
            store.dispatch(actions.updateDataStores([
                {id: 'local-1'},
                {id: 'local-2'}
            ] as any));
            store.dispatch(actions.updateDataSources('local-2', [
                {id: 'fileset-1'},
                {id: 'fileset-2'}
            ] as any));
            expect(store.getState().data.dataStores).to.deep.equal([
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
            store.dispatch(actions.updateDataStores([
                {id: 'local-1'},
                {id: 'local-2'}
            ] as any));
            store.dispatch(actions.updateDataSources('local-2', [
                {id: 'fileset-1'},
                {id: 'fileset-2'}
            ] as any));
            store.dispatch(actions.updateDataSourceTemporalCoverage('local-2', 'fileset-1', [2010, 2015]));
            expect(store.getState().data.dataStores).to.deep.equal([
                {id: 'local-1'},
                {
                    id: 'local-2', dataSources: [
                    {id: 'fileset-1', temporalCoverage: [2010, 2015]},
                    {id: 'fileset-2'}
                ]
                }
            ]);
        });

        it('setSelectedDataStoreId', () => {
            store.dispatch(actions.updateDataStores([
                {id: 'local-1', dataSources: []},
                {id: 'local-2', dataSources: []}
            ] as any));
            store.dispatch(actions.setSelectedDataStoreId('local-2'));
            expect(store.getState().control.selectedDataStoreId).to.equal('local-2');
            store.dispatch(actions.setSelectedDataStoreId(null));
            expect(store.getState().control.selectedDataStoreId).to.be.null;
        });

        it('setSelectedDataSourceId', () => {
            store.dispatch(actions.setSelectedDataSourceId('ds-1'));
            expect(store.getState().control.selectedDataSourceId).to.equal('ds-1');
            store.dispatch(actions.setSelectedDataSourceId(null));
            expect(store.getState().control.selectedDataSourceId).to.be.null;
        });

        it('setDataSourceFilterExpr', () => {
            store.dispatch(actions.setDataSourceFilterExpr('oz mon'));
            expect(store.getState().control.dataSourceFilterExpr).to.equal('oz mon');
            store.dispatch(actions.setDataSourceFilterExpr(null));
            expect(store.getState().control.dataSourceFilterExpr).to.be.null;
        });
    });

    describe('Operations actions', () => {

        it('updateOperations', () => {
            store.dispatch(actions.updateOperations([
                {name: 'op-1'},
                {name: 'op-2'}
            ] as any));
            expect(store.getState().data.operations).to.deep.equal([
                {name: 'op-1'},
                {name: 'op-2'}
            ]);
        });

        it('setSelectedOperationName', () => {
            store.dispatch(actions.setSelectedOperationName('op-2'));
            expect(store.getState().control.selectedOperationName).to.equal('op-2');
            store.dispatch(actions.setSelectedOperationName(null));
            expect(store.getState().control.selectedOperationName).to.be.null;
        });

        it('setOperationFilterTags', () => {
            store.dispatch(actions.setOperationFilterTags(['a', 'b']));
            expect(store.getState().control.operationFilterTags).to.deep.equal(['a', 'b']);
            store.dispatch(actions.setOperationFilterTags(null));
            expect(store.getState().control.operationFilterTags).to.be.null;
        });

        it('setOperationFilterExpr', () => {
            store.dispatch(actions.setOperationFilterExpr('read wri'));
            expect(store.getState().control.operationFilterExpr).to.equal('read wri');
            store.dispatch(actions.setOperationFilterExpr(null));
            expect(store.getState().control.operationFilterExpr).to.be.null;
        });
    });

    describe('Workspace actions', () => {

        it('setCurrentWorkspace - scratch', () => {
            store.dispatch(actions.setCurrentWorkspace({
                baseDir: '/1/2/3',
                isScratch: true,
            } as any));
            expect(store.getState().data.workspace).to.deep.equal({
                baseDir: '/1/2/3',
                isScratch: true,
            });
            expect(store.getState().session.lastWorkspacePath).to.be.null;
        });

        it('setCurrentWorkspace - non-scratch', () => {
            store.dispatch(actions.setCurrentWorkspace({
                baseDir: '/uh/oh/ah',
                isScratch: false,
            } as any));
            expect(store.getState().data.workspace).to.deep.equal({
                baseDir: '/uh/oh/ah',
                isScratch: false,
            });
            expect(store.getState().session.lastWorkspacePath).to.equal('/uh/oh/ah');
        });

        it('setSelectedWorkspaceResourceId - w/o variables', () => {
            store.dispatch(actions.setCurrentWorkspace({
                baseDir: '/uh/oh/ah',
                isScratch: false,
                resources: [
                    {name: 'res_1', variables: []},
                    {name: 'res_2', variables: []}
                ]
            } as any));
            store.dispatch(actions.setSelectedWorkspaceResourceId('res_2'));
            expect(store.getState().control.selectedWorkspaceResourceId).to.equal('res_2');
            expect(store.getState().control.selectedVariableName).to.be.null;
        });

        it('setSelectedWorkspaceResourceId - with variables', () => {
            store.dispatch(actions.setCurrentWorkspace({
                baseDir: '/uh/oh/ah',
                isScratch: false,
                resources: [
                    {name: 'res_1', variables: []},
                    {name: 'res_2', variables: [{name: 'var_1'}, {name: 'var_2'}]}
                ]
            } as any));
            store.dispatch(actions.setSelectedWorkspaceResourceId('res_2'));
            expect(store.getState().control.selectedWorkspaceResourceId).to.equal('res_2');
            expect(store.getState().control.selectedVariableName).to.equal('var_1');
        });

        it('setSelectedWorkflowStepId', () => {
            store.dispatch(actions.setSelectedWorkflowStepId('res_2'));
            expect(store.getState().control.selectedWorkflowStepId).to.equal('res_2');
            store.dispatch(actions.setSelectedWorkflowStepId(null));
            expect(store.getState().control.selectedWorkflowStepId).to.be.null;
        });

        it('setSelectedVariableName', () => {
            store.dispatch(actions.setSelectedVariableName('var_3'));
            expect(store.getState().control.selectedVariableName).to.equal('var_3');
            store.dispatch(actions.setSelectedVariableName(null));
            expect(store.getState().control.selectedVariableName).to.be.null;
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
            store.dispatch(actions.setCurrentWorkspace(workspace as any));
            store.dispatch(actions.setSelectedWorkspaceResourceId('res_1'));
            store.dispatch(actions.setSelectedVariableName('analysed_sst'));
            expect(store.getState().data.layers).to.deep.equal([
                {
                    id: actions.SELECTED_VARIABLE_LAYER_ID,
                    type: "VariableImage",
                    name: "analysed_sst of res_1",
                    show: true,
                    resName: "res_1",
                    varName: "analysed_sst",
                    varIndex: [0],
                    colorMapName: "jet",
                    alphaBlending: false,
                    displayMin: 270,
                    displayMax: 310,
                    imageEnhancement: {
                        alpha: 1,
                        brightness: 1,
                        contrast: 1,
                        gamma: 1,
                        hue: 0,
                        saturation: 1,
                    },
                }
            ]);
        });

        it('setSelectedVariableName - with non-image variable selection', () => {
            store.dispatch(actions.setCurrentWorkspace(workspace as any));
            store.dispatch(actions.setSelectedWorkspaceResourceId('res_1'));
            store.dispatch(actions.setSelectedVariableName('profile'));
            expect(store.getState().data.layers).to.deep.equal([
                {
                    id: actions.SELECTED_VARIABLE_LAYER_ID,
                    type: "Unknown",
                    name: "profile of res_1",
                    show: true,
                }
            ]);
        });

        it('setSelectedVariableName - can restore previous layer state', () => {
            const selectedVariableLayerOld = {
                id: actions.SELECTED_VARIABLE_LAYER_ID,
                    type: "VariableImage",
                name: "analysed_sst of res_1",
                show: true,
                resName: "res_1",
                varName: "analysed_sst",
                varIndex: [139],
                colorMapName: "jet",
                alphaBlending: false,
                displayMin: 270,
                displayMax: 300,
                imageEnhancement: {
                    alpha: 1,
                    brightness: 1,
                    contrast: 1,
                    gamma: 1,
                    hue: 0,
                    saturation: 1,
                }
            };
            const selectedVariableLayerNew = {
                id: actions.SELECTED_VARIABLE_LAYER_ID,
                type: "VariableImage",
                name: "sst_error of res_1",
                show: true,
                resName: "res_1",
                varName: "sst_error",
                varIndex: [0],
                colorMapName: "jet",
                alphaBlending: false,
                displayMin: 0,
                displayMax: 1,
                imageEnhancement: {
                    alpha: 1,
                    brightness: 1,
                    contrast: 1,
                    gamma: 1,
                    hue: 0,
                    saturation: 1,
                }
            };

            store.dispatch(actions.setCurrentWorkspace(workspace as any));
            store.dispatch(actions.setSelectedWorkspaceResourceId('res_1'));
            store.dispatch(actions.setSelectedVariableName('analysed_sst'));
            store.dispatch(actions.updateLayer({id: actions.SELECTED_VARIABLE_LAYER_ID, varIndex: [139], displayMax: 300} as any));
            expect(store.getState().data.layers).to.deep.equal([selectedVariableLayerOld]);
            store.dispatch(actions.setSelectedVariableName('sst_error'));
            expect(store.getState().data.layers).to.deep.equal([selectedVariableLayerNew]);
            store.dispatch(actions.setSelectedVariableName('analysed_sst'));
            expect(store.getState().data.layers).to.deep.equal([selectedVariableLayerOld]);
        });

        it('addVariableLayer - w/o variable selection', () => {
            store.dispatch(actions.setCurrentWorkspace(workspace as any));
            store.dispatch(actions.addVariableLayer('ID756473'));
            expect(store.getState().data.layers).to.deep.equal([
                {
                    id: actions.SELECTED_VARIABLE_LAYER_ID,
                    type: 'Unknown',
                    name: null,
                    show: true,
                }
            ]);
        });

        it('addVariableLayer - with image variable selection', () => {
            store.dispatch(actions.setCurrentWorkspace(workspace as any));
            store.dispatch(actions.setSelectedWorkspaceResourceId('res_1'));
            store.dispatch(actions.setSelectedVariableName('analysed_sst'));
            store.dispatch(actions.addVariableLayer('ID756473'));
            expect(store.getState().data.layers).to.deep.equal([
                {
                    id: actions.SELECTED_VARIABLE_LAYER_ID,
                    type: "VariableImage",
                    name: "analysed_sst of res_1",
                    show: true,
                    resName: "res_1",
                    varName: "analysed_sst",
                    varIndex: [0],
                    colorMapName: "jet",
                    alphaBlending: false,
                    displayMin: 270,
                    displayMax: 310,
                    imageEnhancement: {
                        alpha: 1,
                        brightness: 1,
                        contrast: 1,
                        gamma: 1,
                        hue: 0,
                        saturation: 1,
                    },
                },
                {
                    id: "ID756473",
                    type: "VariableImage",
                    name: "analysed_sst of res_1",
                    show: true,
                    resName: "res_1",
                    varName: "analysed_sst",
                    varIndex: [0],
                    colorMapName: "jet",
                    alphaBlending: false,
                    displayMin: 270,
                    displayMax: 310,
                    imageEnhancement: {
                        alpha: 1,
                        brightness: 1,
                        contrast: 1,
                        gamma: 1,
                        hue: 0,
                        saturation: 1,
                    },
                }
            ]);
        });

        it('addVariableLayer - with non-image variable selection', () => {
            store.dispatch(actions.setCurrentWorkspace(workspace as any));
            store.dispatch(actions.setSelectedWorkspaceResourceId('res_1'));
            store.dispatch(actions.setSelectedVariableName('profile'));
            store.dispatch(actions.addVariableLayer('ID756473'));
            expect(store.getState().data.layers).to.deep.equal([
                {
                    id: actions.SELECTED_VARIABLE_LAYER_ID,
                    type: "Unknown",
                    name: "profile of res_1",
                    show: true,
                }
            ]);
        });

        it('addLayer', () => {
            store.dispatch(actions.addLayer({id: 'layer-2', name: 'L2', show: true} as LayerState));
            expect(store.getState().data.layers).to.deep.equal([
                {id: actions.SELECTED_VARIABLE_LAYER_ID, name: null, show: true, type: 'Unknown'},
                {id: 'layer-2', name: 'L2', show: true},
            ]);
        });

        it('removeLayer', () => {
            store.dispatch(actions.addLayer({id: 'layer-1', name: 'L1', show: true} as LayerState));
            store.dispatch(actions.addLayer({id: 'layer-2', name: 'L2', show: true} as LayerState));
            store.dispatch(actions.removeLayer('layer-2'));
            expect(store.getState().data.layers).to.deep.equal([
                {id: actions.SELECTED_VARIABLE_LAYER_ID, name: null, show: true, type: 'Unknown'},
                {id: 'layer-1', name: 'L1', show: true},
            ]);
        });

        it('updateLayer', () => {
            store.dispatch(actions.addLayer({id: 'layer-1', name: 'L1', show: true} as LayerState));
            store.dispatch(actions.addLayer({id: 'layer-2', name: 'L2', show: true} as LayerState));
            store.dispatch(actions.addLayer({id: 'layer-3', name: 'L3', show: true} as LayerState));
            store.dispatch(actions.updateLayer({id: 'layer-2', show: false} as LayerState));
            expect(store.getState().data.layers).to.deep.equal([
                {id: actions.SELECTED_VARIABLE_LAYER_ID, name: null, show: true, type: 'Unknown'},
                {id: 'layer-1', name: 'L1', show: true},
                {id: 'layer-2', name: 'L2', show: false},
                {id: 'layer-3', name: 'L3', show: true},
            ]);
            store.dispatch(actions.updateLayer({id: 'layer-1', name: 'LX'} as LayerState));
            expect(store.getState().data.layers).to.deep.equal([
                {id: actions.SELECTED_VARIABLE_LAYER_ID, name: null, show: true, type: 'Unknown'},
                {id: 'layer-1', name: 'LX', show: true},
                {id: 'layer-2', name: 'L2', show: false},
                {id: 'layer-3', name: 'L3', show: true},
            ]);
        });

        it('setShowSelectedVariableLayer', () => {
            store.dispatch(actions.setShowSelectedVariableLayer(true));
            expect(store.getState().session.showSelectedVariableLayer).to.equal(true);
            expect(store.getState().data.layers).to.deep.equal([
                {id: actions.SELECTED_VARIABLE_LAYER_ID, name: null, show: true, type: 'Unknown'},
            ]);

            store.dispatch(actions.setShowSelectedVariableLayer(false));
            expect(store.getState().session.showSelectedVariableLayer).to.equal(false);
            expect(store.getState().data.layers).to.deep.equal([
                {id: actions.SELECTED_VARIABLE_LAYER_ID, name: null, show: false, type: 'Unknown'},
            ]);
        });

        it('setShowSelectedVariableLayer - setSelectedLayerId', () => {
            store.dispatch(actions.setSelectedLayerId(actions.SELECTED_VARIABLE_LAYER_ID));

            store.dispatch(actions.setShowSelectedVariableLayer(true));
            expect(store.getState().control.selectedLayerId).to.be.equal(actions.SELECTED_VARIABLE_LAYER_ID);

            store.dispatch(actions.setShowSelectedVariableLayer(false));
            expect(store.getState().control.selectedLayerId).to.be.null;
        });

        it('setSelectedLayerId', () => {
            store.dispatch(actions.setSelectedLayerId('var2'));
            expect(store.getState().control.selectedLayerId).to.equal('var2');
            store.dispatch(actions.setSelectedLayerId(null));
            expect(store.getState().control.selectedLayerId).to.be.null;
        });
    });

    describe('OperationStepDialog actions', () => {

        it('show/hideOperationStepDialog', () => {
            let inputAssignments;
            store.dispatch(actions.showOperationStepDialog());
            expect(store.getState().control.dialogs['operationStepDialog']).to.deep.equal({
                isOpen: true
            });
            store.dispatch(actions.hideOperationStepDialog());
            expect(store.getState().control.dialogs['operationStepDialog']).to.deep.equal({
                isOpen: false,
                inputAssignments
            });
            store.dispatch(actions.hideOperationStepDialog({op1: {a: 3, b: 8}}));
            expect(store.getState().control.dialogs['operationStepDialog']).to.deep.equal({
                isOpen: false,
                inputAssignments: {
                    op1: {a: 3, b: 8}
                }
            });
            store.dispatch(actions.hideOperationStepDialog({op2: {x: 2, y: 1}}));
            expect(store.getState().control.dialogs['operationStepDialog']).to.deep.equal({
                isOpen: false,
                inputAssignments: {
                    op1: {a: 3, b: 8},
                    op2: {x: 2, y: 1}
                }
            });
        });
    });

});
