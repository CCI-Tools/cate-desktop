import {expect} from 'chai';
import * as fs from 'fs';

import * as selectors from './selectors';
import {State, ResourceState, DataState, ControlState} from "./state";

describe('DataStore/DataSource selectors', function () {
    const getState = (dataStores, selectedDataStoreId?, selectedDataSourceId?, dataSourceFilterExpr?) => {
        return {
            data: {dataStores},
            control: {selectedDataStoreId, selectedDataSourceId, dataSourceFilterExpr}
        };
    };

    const dataSources1 = [
        {id: 'ds1', name: 'A1'},
        {id: 'ds2', name: 'A2'},
        {id: 'ds3', name: 'A3'},
    ];
    const dataStore1 = {id: 'local1', dataSources: dataSources1};

    const dataSources2 = [
        {id: 'ds1', name: 'B1'},
        {id: 'ds2', name: 'B2'},
        {id: 'ds3', name: 'B3'},
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
        ).to.deep.equal([{id: 'ds2', name: 'B2'}]);

        expect(selectors.filteredDataSourcesSelector(getState(dataStores, 'local2', undefined, '3 B') as State)
        ).to.deep.equal([{id: 'ds3', name: 'B3'}]);
    });

    it('selectedDataSourceSelector', function () {
        expect(selectors.selectedDataSourceSelector(getState(dataStores, 'local2', null,) as State)
        ).to.be.null;

        expect(selectors.selectedDataSourceSelector(getState(dataStores, 'local2', 'ds2') as State)
        ).to.be.deep.equal({id: 'ds2', name: 'B2'});

        expect(selectors.selectedDataSourceSelector(getState(dataStores, 'local2', 'ds4') as State)
        ).to.be.undefined;
    });
});

describe('Operation selectors', function () {

    const getState = (operations, selectedOperationName?, operationFilterTags?, operationFilterExpr?) => {
        return {
            data: {operations},
            control: {selectedOperationName, operationFilterTags, operationFilterExpr}
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
        ).to.deep.equal(new Map([['x', 2], ['y', 2], ['z', 1]]));
    });
});

describe('Variable selectors', function () {

    const getState = (resources, selectedWorkspaceResourceId?, selectedVariableName?, resourceNamePrefix?) => {
        return {
            data: {
                workspace: {
                    resources
                }
            },
            control: {selectedWorkspaceResourceId, selectedVariableName},
            session: {resourceNamePrefix},
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

    it('selectedVariablesSelector', function () {
        expect(selectors.selectedVariablesSelector(getState(resources, 'res1') as any)
        ).to.be.null;

        expect(selectors.selectedVariablesSelector(getState(resources, 'res2') as any)
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

    it('newResourceNameSelector', function () {
        expect(selectors.newResourceNameSelector(getState(null, undefined, undefined, 'res') as any)
        ).to.equal('');

        expect(selectors.newResourceNameSelector(getState(resources, undefined, undefined, null) as any)
        ).to.equal('');

        expect(selectors.newResourceNameSelector(getState([], undefined, undefined, 'res') as any)
        ).to.equal('res1');

        expect(selectors.newResourceNameSelector(getState(resources, undefined, undefined, 'res') as any)
        ).to.equal('res3');
    });
});

describe('Layer selectors', function () {
    // TODO (forman/marcoz): write unit tests for Layer selectors
});

describe('ColorMap selectors', function () {
    // TODO (forman/marcoz): write unit tests for ColorMap selectors
});
