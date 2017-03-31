import * as State from "../state";
import {IProcessData, IServiceObject} from "./WebSocketMock";

/**
 * Simulates the a local/remote WebAPIClient service.
 * Mimics a local/remote webservice usually running on a Python Tornado.
 */
export class WebAPIServiceMock implements IServiceObject {
    dataStores: Array<State.DataStoreState> = [];
    dataSources = {};
    operations: Array<State.OperationState> = [];
    workspaces = {};
    workspaceId = 0;

    // processData is picked up by WebSocketMock
    processData: {[methodName: string]: IProcessData} = {
        call_operation: {
            numSteps: 10,
            delayPerStep: 1000,
            delay: 500
        },
        set_workspace_resource: {
            numSteps: 5,
            delayPerStep: 200,
            delay: 100
        },
        get_data_sources: {
            numSteps: 2,
            delayPerStep: 100,
            delay: 100
        },
        get_ds_temporal_coverage: {
            numSteps: 0,
            delay: 1000
        }
    };

    constructor() {
        const descriptions = [
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ',
            'Nullam dignissim vitae mi non tempor. ',
            'Phasellus aliquam metus eget ex molestie sagittis. Nulla alique tellus neque, at feugi lectus feugiat a.',
            'Nunc vehicula neque iaculis ex lobortis, in consequat nulla tempus.',
            'Curabitur imperdiet tellus eget sapien imperdiet egestas.',
            null,
        ];

        const variables = [
            {name: 'var_a', units: 'mm', long_name: 'Variable 1'},
            {name: 'var_b', units: 'l', long_name: 'Variable 2'},
            {name: 'var_c', units: 'm^3', long_name: 'Variable 3'},
            {name: 'var_d', units: 'K', long_name: 'Variable 4'},
        ];

        const dataSourcesSizes = [12, 300, 2, 0, 1];
        for (let i = 0; i < dataSourcesSizes.length; i++) {
            const dataStoreId = `data.store.${i}`;
            this.dataStores.push({
                id: dataStoreId,
                name: `Data Store ${i + 1}`,
                description: descriptions[(i + 1) % descriptions.length],
            });
            const dataSources = [];
            for (let j = 0; j < dataSourcesSizes[i]; j++) {
                let vars;
                if (j % 5 != 0) {
                    vars = [];
                    for (let k = 0; k < variables.length; k++) {
                        vars.push(variables[(j + k) % variables.length]);
                    }
                }
                dataSources.push({
                    id: `data.source.${i}.${j}`,
                    name: `Data Source ${i + 1}-${j + 1}`,
                    meta_info: {
                        description: descriptions[(j + 2) % descriptions.length],
                        variables: vars
                    },
                });
            }
            this.dataSources[dataStoreId] = dataSources;
        }

        this.operations.push({
            name: 'open_dataset',
            qualifiedName: 'open_dataset',
            hasMonitor: true,
            description: 'Open a dataset',
            tags: ['input'],
            inputs: [
                {
                    name: 'ds_name',
                    dataType: 'str',
                    description: null,
                },
                {
                    name: 'start_date',
                    dataType: 'str',
                    description: null,
                },
                {
                    name: 'end_date',
                    dataType: 'str',
                    description: null,
                },
                {
                    name: 'sync',
                    dataType: 'bool',
                    description: null,
                }
            ],
            outputs: [
                {
                    name: 'return',
                    dataType: 'Dataset',
                    description: null,
                }
            ],
        });

        const numOps = 120;
        const inputNames = ['count', 'threshold', 'ratio', 'method', 'accurate'];
        const inputDataTypes = ['int', 'float', 'float', 'str', 'bool'];

        for (let i = 0; i < numOps; i++) {

            // See Python cate.core.op.OpMetaInfo
            let opMetaInfo: State.OperationState = {
                name: `operation_${i}`,
                qualifiedName: `cate.ops.operation_${i}`,
                description: descriptions[i % descriptions.length],
                hasMonitor: false,
                tags: [],
                inputs: [],
                outputs: [],
            };

            for (let j = 0; j < (1 + i % 4); j++) {
                opMetaInfo.tags.push(`tag_${j + 1}`);
            }

            if (i % 8 !== 0) {
                opMetaInfo.inputs.push({
                    name: 'ds',
                    dataType: 'Dataset',
                    description: 'Source dataset',
                });
                if (i % 5 === 0) {
                    opMetaInfo.inputs.push({
                        name: 'ds_ref',
                        dataType: 'Dataset',
                        description: 'Reference dataset',
                    });
                }
            }
            for (let j = 0; j < i % inputNames.length; j++) {
                opMetaInfo.inputs.push({
                    name: inputNames[j],
                    dataType: inputDataTypes[(i + j) % inputDataTypes.length],
                    description: descriptions[(i + j) % descriptions.length],
                });
            }

            if (i % 7 != 0) {
                opMetaInfo.outputs.push({
                    name: 'return',
                    dataType: 'Dataset',
                    description: 'The transformed dataset',
                });
            } else {
                opMetaInfo.outputs.push({
                    name: 'return',
                    dataType: inputDataTypes[i % inputDataTypes.length],
                    description: descriptions[(i + 1) % descriptions.length],
                });
            }

            this.operations.push(opMetaInfo);
        }
    }

    get_data_stores() {
        return this.dataStores;
    }

    get_data_sources(dataStoreId) {
        return this.dataSources[dataStoreId];
    }

    get_ds_temporal_coverage(dataStoreId: string, dataSourceId: string) {
        if (dataSourceId.endsWith("0")) {
            return {
                temporal_coverage_start: "2010-01-01",
                temporal_coverage_end: "2014-12-31"
            };
        } else if (dataSourceId.endsWith("1")) {
            return {};
        } else if (dataSourceId.endsWith("2")) {
            return {
                temporal_coverage_start: "abc",
                temporal_coverage_end: "2014-12-31"
            };        } else {
            return {
                temporal_coverage_start: "2010-01-01",
                temporal_coverage_end: "2010-12-31"
            };
        }
    }

    get_operations() {
        return this.operations;
    }

    //noinspection JSMethodCanBeStatic
    call_operation(opName: string, opArgs: any) {
        return {opName, opArgs};
    }

    new_workspace(): Object {
        const id = this.workspaceId++;
        let workspace = {
            base_dir: `scratch/workspace-${id}`,
            description: null,
            is_scratch: true,
            is_saved: false,
            is_modified: false,
            is_open: true,
            workflow: {
                steps: []
            },
        };
        this.workspaces[workspace.base_dir] = workspace;
        return Object.assign({}, workspace);
    }

    open_workspace(baseDir: string): State.WorkspaceState {
        const workspace = this.workspaces[baseDir];
        if (!workspace) {
            throw Error(`Not a workspace: ${baseDir}`);
        }
        workspace.is_open = true;
        workspace.is_saved = true;
        return Object.assign({}, workspace);
    }

    close_workspace(baseDir: string): State.WorkspaceState {
        const workspace = this.workspaces[baseDir];
        if (!workspace) {
            throw Error(`Not a workspace: ${baseDir}`);
        }
        workspace.is_open = false;
        return Object.assign({}, workspace);
    }

    save_workspace(baseDir: string): State.WorkspaceState {
        const workspace = this.workspaces[baseDir];
        if (!workspace) {
            throw Error(`Not a workspace: ${baseDir}`);
        }
        if (!workspace.is_open) {
            throw Error(`Workspace is not open: ${baseDir}`);
        }
        if (workspace.is_scratch) {
            throw Error(`Scratch workspace cannot be saved: ${baseDir}`);
        }
        workspace.is_saved = true;
        return Object.assign({}, workspace);
    }

    save_workspace_as(baseDir: string, newBaseDir: string): State.WorkspaceState {
        let workspace = this.workspaces[baseDir];
        if (!workspace) {
            throw Error(`Not a workspace: ${baseDir}`);
        }
        if (!workspace.is_open) {
            throw Error(`Workspace is not open: ${baseDir}`);
        }
        workspace = Object.assign({}, workspace, {
            base_dir: newBaseDir,
            is_saved: true,
            is_scratch: false,
        });
        this.workspaces[workspace.base_dir] = workspace;
        return Object.assign({}, workspace);
    }

    set_workspace_resource(baseDir: string, resName: string, opName: string, opArgs: any): State.WorkspaceState {
        let workspace = this.workspaces[baseDir];
        if (!workspace) {
            throw Error(`Not a workspace: ${baseDir}`);
        }
        if (!workspace.is_open) {
            throw Error(`Workspace is not open: ${baseDir}`);
        }
        const op = this.operations.find(op => op.name === opName);
        if (!op) {
            throw Error(`Unknown operation: ${opName}`);
        }

        const inputs = {};
        for (let input of op.inputs) {
            if (input.name in opArgs) {
                // Note: check if opArgs[input.name] is a "sourceRef" or a constant "value". We use just "value" here.
                inputs[input.name] = {
                    value: opArgs[input.name],
                    source: null,
                };
            }
            // console.log('WebAPIServiceMock: input', input);
        }

        const outputs = {};
        for (let output of op.outputs) {
            // console.log('WebAPIServiceMock: output', output);
        }

        const oldWorkflow = workspace.workflow;
        const newSteps = oldWorkflow.steps.slice();
        newSteps.push({
            id: resName,
            type: 'operation',
            op: opName,
            input: inputs,
            output: outputs,
        });
        const newWorkflow = Object.assign({}, oldWorkflow, {steps: newSteps});

        const varList = ['var_a', 'var_b', 'var_c', 'var_d'].map(v => v + '_' + resName)  as Array<string>;
        const variables = [] as Array<State.VariableState>;
        for (const v of varList) {
            variables.push({
                name: v,
                dataType: 'float32',
                units: 'si',
                ndim: 2,
                shape: [420, 840],
                dimensions: ['lat', 'lon'],
                imageLayout: {
                    numLevels: 5,
                    numLevelZeroTilesX: 2,
                    numLevelZeroTilesY: 1,
                    tileWidth: 512,
                    tileHeight: 256,
                }
            });
        }

        const oldResources = workspace.resources || [];
        const newResources = oldResources.slice();
        newResources.push({
            name: resName,
            dataType: 'Dataset',
            variables: variables
        });
        workspace = Object.assign({}, workspace, {
            is_modified: true,
            workflow: newWorkflow,
            resources: newResources,
        });
        this.workspaces[workspace.base_dir] = workspace;
        return Object.assign({}, workspace);
    }
}
