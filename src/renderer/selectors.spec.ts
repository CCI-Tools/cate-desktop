import {expect} from 'chai';

import * as selectors from './selectors';
import {State, ResourceState} from "./state";

describe('API selectors', function () {
    const getState = () => {
        return {
            data: {appConfig: {webAPIClient: {}}},
        };
    };

    it('webAPISelector', function () {
        expect(selectors.webAPIClientSelector(getState() as State)
        ).not.to.be.null;

        expect(selectors.backendConfigAPISelector(getState() as State)
        ).not.to.be.null;

        expect(selectors.datasetAPISelector(getState() as State)
        ).not.to.be.null;

        expect(selectors.operationAPISelector(getState() as State)
        ).not.to.be.null;

        expect(selectors.workspaceAPISelector(getState() as State)
        ).not.to.be.null;

        expect(selectors.colorMapsAPISelector(getState() as State)
        ).not.to.be.null;
    });
});

describe('DataStore/DataSource selectors', function () {
    const getState = (dataStores, selectedDataStoreId?, selectedDataSourceId?, dataSourceFilterExpr?) => {
        return {
            data: {dataStores},
            session: {selectedDataStoreId, selectedDataSourceId, dataSourceFilterExpr, showDataSourceIdsOnly: false}
        };
    };

    const dataSources1 = [
        {id: 'A1', title: 'Aha 1'},
        {id: 'A2', title: 'Aha 2'},
        {id: 'A3', title: 'Aha 3'},
    ];
    const dataStore1 = {id: 'local1', dataSources: dataSources1};

    const dataSources2 = [
        {id: 'B1', title: 'Bibo 1'},
        {id: 'B2', title: 'Bibo 2'},
        {id: 'B3', title: 'Bibo 3'},
    ];
    const dataStore2 = {id: 'local2', dataSources: dataSources2};
    const dataStores = [dataStore1, dataStore2];

    it('selectedDataStoreSelector', function () {
        expect(selectors.selectedDataStoreSelector(getState(null, 'local1') as State)
        ).to.be.null;

        expect(selectors.selectedDataStoreSelector(getState(dataStores, null) as State)
        ).to.be.null;

        expect(selectors.selectedDataStoreSelector(getState(dataStores, 'local2') as State)
        ).to.deep.equal(dataStore2);

        expect(selectors.selectedDataStoreSelector(getState(dataStores, 'local3') as State)
        ).to.be.undefined;
    });

    it('selectedDataSourcesSelector', function () {
        expect(selectors.selectedDataSourcesSelector(getState(null, 'local1') as State)).to.be.null;

        expect(selectors.selectedDataSourcesSelector(getState(dataStores, null) as State)
        ).to.be.null;

        expect(selectors.selectedDataSourcesSelector(getState(dataStores, 'local2') as State)
        ).to.deep.equal(dataSources2);

        expect(selectors.selectedDataSourcesSelector(getState(dataStores, 'local3') as State)
        ).to.be.null;
    });

    it('filteredDataSourcesSelector', function () {
        expect(selectors.filteredDataSourcesSelector(getState(dataStores, 'local2', undefined, '') as State)
        ).to.deep.equal(dataSources2);

        expect(selectors.filteredDataSourcesSelector(getState(dataStores, 'local2', undefined, 'A') as State)
        ).to.deep.equal([]);

        expect(selectors.filteredDataSourcesSelector(getState(dataStores, 'local2', undefined, 'b') as State)
        ).to.deep.equal(dataSources2);

        expect(selectors.filteredDataSourcesSelector(getState(dataStores, 'local2', undefined, '2') as State)
        ).to.deep.equal([{id: 'B2', title: 'Bibo 2'}]);

        expect(selectors.filteredDataSourcesSelector(getState(dataStores, 'local2', undefined, '3 B') as State)
        ).to.deep.equal([{id: 'B3', title: 'Bibo 3'}]);
    });

    it('selectedDataSourceSelector', function () {
        expect(selectors.selectedDataSourceSelector(getState(dataStores, 'local2', null,) as State)
        ).to.be.null;

        expect(selectors.selectedDataSourceSelector(getState(dataStores, 'local2', 'B2') as State)
        ).to.be.deep.equal({id: 'B2', title: 'Bibo 2'});

        expect(selectors.selectedDataSourceSelector(getState(dataStores, 'local2', 'B4') as State)
        ).to.be.undefined;
    });
});

describe('Operation selectors', function () {

    const getState = (operations, selectedOperationName?, operationFilterTags?, operationFilterExpr?) => {
        return {
            data: {operations},
            session: {selectedOperationName, operationFilterTags, operationFilterExpr}
        };
    };

    const op1 = {name: 'opa', tags: ['x', 'y']};
    const op2 = {name: 'opb', tags: ['x']};
    const op3 = {name: 'opc', tags: ['y']};
    const operations = [op1, op2, op3];

    it('selectedOperationSelector', function () {
        expect(selectors.selectedOperationSelector(getState(null, 'opb') as State)
        ).to.be.null;

        expect(selectors.selectedOperationSelector(getState(operations, null) as State)
        ).to.be.null;

        expect(selectors.selectedOperationSelector(getState(operations, 'opb') as State)
        ).to.deep.equal(op2);

        expect(selectors.selectedOperationSelector(getState(operations, 'opd') as State)
        ).to.be.undefined;
    });

    it('filteredOperationsSelector', function () {
        expect(selectors.filteredOperationsSelector(getState(null, undefined, ['a'], 'a') as State)
        ).to.deep.equal([]);

        expect(selectors.filteredOperationsSelector(getState(operations, undefined, [], '',) as State)
        ).to.deep.equal(operations);

        expect(selectors.filteredOperationsSelector(getState(operations, undefined, ['x'], '',) as State)
        ).to.deep.equal([op1, op2]);

        expect(selectors.filteredOperationsSelector(getState(operations, undefined, ['x', 'y'], null) as State)
        ).to.deep.equal([op1]);

        expect(selectors.filteredOperationsSelector(getState(operations, undefined, [], 'a') as State)
        ).to.deep.equal([op1]);

        expect(selectors.filteredOperationsSelector(getState(operations, undefined, ['x'], 'b') as State)
        ).to.deep.equal([op2]);

        expect(selectors.filteredOperationsSelector(getState(operations, undefined, [], 'C Op') as State)
        ).to.deep.equal([op3]);
    });

    it('operationsTagCountsSelector', function () {
        expect(selectors.operationsTagCountsSelector(getState(null) as State)
        ).to.deep.equal(new Map());

        expect(selectors.operationsTagCountsSelector(getState(operations) as State)
        ).to.deep.equal(new Map([['x', 2], ['y', 2]]));
    });
});

describe('Variable selectors', function () {

    const getState = (resources, selectedWorkspaceResourceName?, selectedVariableName?) => {
        return {
            data: {
                workspace: {
                    resources
                }
            },
            control: {selectedWorkspaceResourceName, selectedVariableName},
            session: {},
        };
    };

    const res1 = {name: 'res1', variables: null};
    const res2 = {name: 'res2', variables: [{name: 'var1'}, {name: 'var2'}]};
    const resources = [res1, res2] as ResourceState[];
    //selectedResourceSelector

    it('selectedResourceSelector', function () {
        expect(selectors.selectedResourceSelector(getState(null, 'res2') as any)
        ).to.be.null;

        expect(selectors.selectedResourceSelector(getState(resources, null) as any)
        ).to.be.null;

        expect(selectors.selectedResourceSelector(getState(resources, 'res4') as any)
        ).to.be.undefined;

        expect(selectors.selectedResourceSelector(getState(resources, 'res2') as any)
        ).to.deep.equal(res2);
    });

    it('variablesSelector', function () {
        expect(selectors.variablesSelector(getState(resources, 'res1') as any)
        ).to.be.null;

        expect(selectors.variablesSelector(getState(resources, 'res2') as any)
        ).to.deep.equal([{name: 'var1'}, {name: 'var2'}]);
    });

    it('selectedVariableSelector', function () {
        expect(selectors.selectedVariableSelector(getState(null, 'res2', 'var3') as any)
        ).to.be.null;

        expect(selectors.selectedVariableSelector(getState(resources, null, 'var3') as any)
        ).to.be.null;

        expect(selectors.selectedVariableSelector(getState(resources, 'res2', null) as any)
        ).to.be.null;

        expect(selectors.selectedVariableSelector(getState(resources, 'res2', 'var2') as any)
        ).to.deep.equal({name: 'var2'});

        expect(selectors.selectedVariableSelector(getState(resources, 'res2', 'var3') as any)
        ).to.be.undefined;
    });

});

describe('Layer selectors', function () {
    // TODO (forman/marcoz): write unit tests for Layer selectors
});

describe('ColorMap selectors', function () {
    // TODO (forman/marcoz): write unit tests for ColorMap selectors
});

describe('Dialog state selector', function () {
    const getState = () => {
        return {
            control: {
                dialogs: {
                    bertDialog: {isOpen: true}
                }
            },
        };
    };

    it('always returns valid state', function () {
        expect(selectors.dialogStateSelector('bertDialog')(getState() as any)
        ).to.deep.equal({isOpen: true});

        expect(selectors.dialogStateSelector('biboDialog')(getState() as any)
        ).to.deep.equal({});
    });

    it('is same instance', function () {
        selectors.dialogStateSelector('bertDialog').should.equal(selectors.dialogStateSelector('bertDialog'));
        selectors.dialogStateSelector('biboDialog').should.equal(selectors.dialogStateSelector('biboDialog'));
    });
});
