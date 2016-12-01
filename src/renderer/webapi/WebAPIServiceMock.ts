import {OperationState, WorkspaceState, DataStoreState} from "../state";

/**
 * Simulates the a local/remote WebAPIClient service.
 * Mimics a local/remote webservice usually running on a Python Tornado.
 */
export class WebAPIServiceMock {
    dataStores: Array<DataStoreState> = [];
    dataSources = {};
    operations: Array<OperationState> = [];
    workspaces = {};
    workspaceId = 0;

    constructor() {
        const descriptions = [
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ',
            'Nullam dignissim vitae mi non tempor. ',
            'Phasellus aliquam metus eget ex molestie sagittis. Nulla alique tellus neque, at feugi lectus feugiat a.',
            'Nunc vehicula neque iaculis ex lobortis, in consequat nulla tempus.',
            'Curabitur imperdiet tellus eget sapien imperdiet egestas.',
            null,
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
                dataSources.push({
                    id: `data.source.${i}.${j}`,
                    name: `Data Source ${i + 1}-${j + 1}`,
                    description: descriptions[(j + 2) % descriptions.length],
                });
            }
            this.dataSources[dataStoreId] = dataSources;
        }

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

    newWorkspace(): Object {
        const id = this.workspaceId++;
        let workspace = {
            path: `{workspace-${id}}`,
            isOpen: true,
            isSaved: false,
            workflow: null,
        };
        this.workspaces[workspace.path] = workspace;
        return Object.assign({}, workspace);
    }

    openWorkspace(path: string): Object {
        const workspace = this.workspaces[path];
        if (!workspace) {
            throw Error(`Not a workspace: ${path}`);
        }
        workspace.isOpen = true;
        workspace.isSaved = true;
        return Object.assign({}, workspace);
    }

    closeWorkspace(path: string): Object {
        const workspace = this.workspaces[path];
        if (!workspace) {
            throw Error(`Not a workspace: ${path}`);
        }
        workspace.isOpen = false;
        return Object.assign({}, workspace);
    }

    saveWorkspace(path: string): Object {
        const workspace = this.workspaces[path];
        if (!workspace) {
            throw Error(`Not a workspace: ${path}`);
        }
        if (!workspace.isOpen) {
            throw Error(`Workspace is not open: ${path}`);
        }
        if (workspace.path.startsWith('{workspace-') && workspace.path.endsWith('}')) {
            throw Error(`Workspace has no path: ${path}`);
        }
        workspace.isSaved = true;
        return Object.assign({}, workspace);
    }

    saveWorkspaceAs(path: string, newPath: string): Object {
        let workspace = this.workspaces[path];
        if (!workspace) {
            throw Error(`Not a workspace: ${path}`);
        }
        if (!workspace.isOpen) {
            throw Error(`Workspace is not open: ${path}`);
        }
        workspace = Object.assign({}, workspace, {
            path: newPath,
            isSaved: true,
        });
        this.workspaces[workspace.path] = workspace;
        return Object.assign({}, workspace);
    }
}
