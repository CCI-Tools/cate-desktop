import {expect} from 'chai';
import * as fs from 'fs';

import * as selectors from './selectors';
import {State} from "./state";


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

        const operations = [{name: 'opa', tags:['x', 'y']}, {name: 'opb', tags:['x']}, {name: 'opc', tags:['y']}];
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
        ).to.deep.equal([{name: 'opa', tags:['x', 'y']}, {name: 'opb', tags:['x']}]);

        expect(selectors.filteredOperationsSelector(
            getState(
                operations,
                ['x', 'y'], null
            ) as State)
        ).to.deep.equal([{name: 'opa', tags:['x', 'y']}]);

        expect(selectors.filteredOperationsSelector(
            getState(
                operations,
                null, 'a'
            ) as State)
        ).to.deep.equal([{name: 'opa', tags:['x', 'y']}]);

        expect(selectors.filteredOperationsSelector(
            getState(
                operations,
                ['x'],  'b'
            ) as State)
        ).to.deep.equal([ {name: 'opb', tags:['x']}]);
    });

    it('operationsTagCountsSelector', function () {
        const getState = (operations) => {
            return { data: {operations} };
        };

        expect(selectors.operationsTagCountsSelector(
            getState(
                null,
            ) as State)
        ).to.deep.equal(new Map());

        expect(selectors.operationsTagCountsSelector(
            getState(
                [{name: 'opa', tags:['x', 'y']}, {name: 'opb', tags:['x', 'z']}, {name: 'opc', tags:['y']}]
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

        const resources = [{name: 'resa', variables: null}, {name: 'resb', variables: [{name:'v1'}, {name:'v2'}]}];

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
        ).to.deep.equal([{name:'v1'}, {name:'v2'}]);
    });
});
