import {expect} from 'chai';
import * as fs from 'fs';

import * as selectors from './selectors';
import {State} from "./state";

describe('DataStore/DataSource selectors', function () {
    const getState = (dataStores, selectedDataStoreId, selectedDataSourceId?, dataSourceFilterExpr?) => {
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
        expect(selectors.selectedDataStoreSelector(
            getState(
                null,
                'local1'
            ) as State)
        ).to.be.null;

        expect(selectors.selectedDataStoreSelector(
            getState(
                dataStores,
                null
            ) as State)
        ).to.be.null;

        expect(selectors.selectedDataStoreSelector(
            getState(
                dataStores,
                'local2'
            ) as State)
        ).to.deep.equal(dataStore2);

        expect(selectors.selectedDataStoreSelector(
            getState(
                dataStores,
                'local3'
            ) as State)
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
        expect(selectors.filteredDataSourcesSelector(getState(dataStores, 'local2', null, '') as State)
        ).to.deep.equal(dataSources2);

        expect(selectors.filteredDataSourcesSelector(getState(dataStores, 'local2', null, 'A') as State)
        ).to.deep.equal([]);

        expect(selectors.filteredDataSourcesSelector(getState(dataStores, 'local2', null, 'b') as State)
        ).to.deep.equal(dataSources2);

        expect(selectors.filteredDataSourcesSelector(getState(dataStores, 'local2', null, '2') as State)
        ).to.deep.equal([{id: 'ds2', name: 'B2'}]);

        expect(selectors.filteredDataSourcesSelector(getState(dataStores, 'local2', null, '2 3') as State)
        ).to.deep.equal([]);
    });

    it('selectedDataSourceSelector', function () {

        expect(selectors.selectedDataSourceSelector(
            getState(
                dataStores,
                'local2',
                null,
            ) as State)
        ).to.be.null;

        expect(selectors.selectedDataSourceSelector(
            getState(
                dataStores,
                'local2',
                'ds2'
            ) as State)
        ).to.be.deep.equal({id: 'ds2', name: 'B2'});

        expect(selectors.selectedDataSourceSelector(
            getState(
                dataStores,
                'local2',
                'ds4'
            ) as State)
        ).to.be.undefined;

    });
});

describe('Operation selectors', function () {

    it('selectedOperationSelector', function () {
        const getState = (operations, selectedOperationName) => {
            return {
                data: {operations},
                control: {selectedOperationName}
            };
        };

        expect(selectors.selectedOperationSelector(
            getState(
                null,
                'opb'
            ) as State)
        ).to.be.undefined;

        expect(selectors.selectedOperationSelector(
            getState(
                [{name: 'opa'}, {name: 'opb'}, {name: 'opc'}],
                null
            ) as State)
        ).to.be.null;

        expect(selectors.selectedOperationSelector(
            getState(
                [{name: 'opa'}, {name: 'opb'}, {name: 'opc'}],
                'opb'
            ) as State)
        ).to.deep.equal({name: 'opb'});
    });

    it('filteredOperationsSelector', function () {
        const getState = (operations, operationFilterTags, operationFilterExpr) => {
            return {
                data: {operations},
                control: {operationFilterTags, operationFilterExpr}
            };
        };
        expect(selectors.filteredOperationsSelector(
            getState(
                null,
                ['a'], 'a'
            ) as State)
        ).to.deep.equal([]);

        const operations = [{name: 'opa', tags: ['x', 'y']}, {name: 'opb', tags: ['x']}, {name: 'opc', tags: ['y']}];
        expect(selectors.filteredOperationsSelector(
            getState(
                operations,
                [], '',
            ) as State)
        ).to.deep.equal(operations);

        expect(selectors.filteredOperationsSelector(
            getState(
                operations,
                ['x'], '',
            ) as State)
        ).to.deep.equal([{name: 'opa', tags: ['x', 'y']}, {name: 'opb', tags: ['x']}]);

        expect(selectors.filteredOperationsSelector(
            getState(
                operations,
                ['x', 'y'], null
            ) as State)
        ).to.deep.equal([{name: 'opa', tags: ['x', 'y']}]);

        expect(selectors.filteredOperationsSelector(
            getState(
                operations,
                null, 'a'
            ) as State)
        ).to.deep.equal([{name: 'opa', tags: ['x', 'y']}]);

        expect(selectors.filteredOperationsSelector(
            getState(
                operations,
                ['x'], 'b'
            ) as State)
        ).to.deep.equal([{name: 'opb', tags: ['x']}]);
    });

    it('operationsTagCountsSelector', function () {
        const getState = (operations) => {
            return {data: {operations}};
        };

        expect(selectors.operationsTagCountsSelector(
            getState(
                null,
            ) as State)
        ).to.deep.equal(new Map());

        expect(selectors.operationsTagCountsSelector(
            getState(
                [{name: 'opa', tags: ['x', 'y']}, {name: 'opb', tags: ['x', 'z']}, {name: 'opc', tags: ['y']}]
            ) as State)
        ).to.deep.equal(new Map([['x', 2], ['y', 2], ['z', 1]]));
    });
});

describe('Variable selectors', function () {

    it('selectedVariablesSelector', function () {
        const getState = (resources, selectedWorkspaceResourceId) => {
            return {
                data: {
                    workspace: {
                        resources
                    }
                },
                control: {selectedWorkspaceResourceId}
            };
        };

        const resources = [{name: 'resa', variables: null}, {name: 'resb', variables: [{name: 'v1'}, {name: 'v2'}]}];

        expect(selectors.selectedVariablesSelector(
            getState(
                resources,
                'resa'
            ) as State)
        ).to.be.null;

        expect(selectors.selectedVariablesSelector(
            getState(
                resources,
                'resb'
            ) as State)
        ).to.deep.equal([{name: 'v1'}, {name: 'v2'}]);
    });
});
