import {OperationState, WorkspaceState, DataStoreState, WorkflowStepState, WorkflowPortState} from "../state";
import {IProcessData, IServiceObject} from "./WebSocketMock";

/**
 * Simulates the a local/remote WebAPIClient service.
 * Mimics a local/remote webservice usually running on a Python Tornado.
 */
export class WebAPIServiceMock implements IServiceObject {
    dataStores: Array<DataStoreState> = [];
    dataSources = {};
    operations: Array<OperationState> = [];
    workspaces = {};
    workspaceId = 0;

    // processData is picked up by WebSocketMock
    processData: {[methodName: string]: IProcessData} = {
        callOperation: {
            numSteps: 10,
            delayPerStep: 500,
            delay: 500
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
            description: 'Open a dataset',
            tags: ['input'],
            inputs: [
                {
                    name: 'ds_name',
                    dataType: 'str',
                },
                {
                    name: 'start_date',
                    dataType: 'str',
                },
                {
                    name: 'end_date',
                    dataType: 'str',
                },
                {
                    name: 'sync',
                    dataType: 'bool',
                }
            ],
            outputs: [
                {
                    name: 'return',
                    dataType: 'Dataset',
                }
            ],
        });

        const numOps = 120;
        const inputNames = ['count', 'threshold', 'ratio', 'method', 'accurate'];
        const inputDataTypes = ['int', 'float', 'float', 'str', 'bool'];

        for (let i = 0; i < numOps; i++) {

            // See Python cate.core.op.OpMetaInfo
            let opMetaInfo: OperationState = {
                name: `operation_${i}`,
                description: descriptions[i % descriptions.length],
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
                    dataType: 'xr.Dataset',
                    description: 'Source dataset',
                });
                if (i % 5 === 0) {
                    opMetaInfo.inputs.push({
                        name: 'ds_ref',
                        dataType: 'xr.Dataset',
                        description: 'Reference dataset',
                    });
                }
            }
            for (let j = 0; j < i % inputNames.length; j++) {
                opMetaInfo.inputs.push({
                    name: inputNames[j],
                    dataType: inputDataTypes[j % inputDataTypes.length],
                    description: descriptions[j % descriptions.length],
                });
            }

            if (i % 7 != 0) {
                opMetaInfo.outputs.push({
                    name: 'return',
                    dataType: 'xr.Dataset',
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

    getDataStores() {
        return this.dataStores;
    }

    getDataSources(dataStoreId) {
        return this.dataSources[dataStoreId];
    }

    getOperations() {
        return this.operations;
    }

    //noinspection JSMethodCanBeStatic
    callOperation(opName: string, opArgs: any) {
        return {opName, opArgs};
    }

    newWorkspace(): Object {
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

    openWorkspace(baseDir: string): WorkspaceState {
        const workspace = this.workspaces[baseDir];
        if (!workspace) {
            throw Error(`Not a workspace: ${baseDir}`);
        }
        workspace.is_open = true;
        workspace.is_saved = true;
        return Object.assign({}, workspace);
    }

    closeWorkspace(baseDir: string): WorkspaceState {
        const workspace = this.workspaces[baseDir];
        if (!workspace) {
            throw Error(`Not a workspace: ${baseDir}`);
        }
        workspace.is_open = false;
        return Object.assign({}, workspace);
    }

    saveWorkspace(baseDir: string): WorkspaceState {
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

    saveWorkspaceAs(baseDir: string, newBaseDir: string): WorkspaceState {
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

    setWorkspaceResource(baseDir: string, resName: string, opName: string, opArgs: any): WorkspaceState {
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

        const inputs = [] as Array<WorkflowPortState>;
        for (let input of op.inputs) {
            if (input.name in opArgs) {
                // TODO (nf/mz): check if opArgs[input.name] is a sourceRef or a constant value. We use just value here.
                inputs.push({
                    name: input.name,
                    value: opArgs[input.name],
                    sourceRef: null,
                });
            }
            console.log(input);
        }

        const outputs = [] as Array<WorkflowPortState>;
        for (let output of op.outputs) {
            console.log(output);
        }

        const oldWorkflow = workspace.workflow;
        const newSteps = oldWorkflow.steps.slice();
        newSteps.push({
            id: resName,
            type: 'operation',
            action: opName,
            inputs,
            outputs,
        } as WorkflowStepState);
        const newWorkflow = Object.assign({}, oldWorkflow, {steps: newSteps});
        workspace = Object.assign({}, workspace, {
            is_modified: true,
            workflow: newWorkflow,
        });
        this.workspaces[workspace.base_dir] = workspace;
        return Object.assign({}, workspace);
    }
}
