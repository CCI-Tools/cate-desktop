import {Store, createStore, applyMiddleware} from 'redux';
import * as actions from './actions';
import {stateReducer} from './reducers';
import thunk from 'redux-thunk'
import {LayerState} from "./state";
import {should, expect} from 'chai';

should();

describe('OperationStepDialog actions', () => {
    let store = null;

    beforeEach(function () {
        const middleware = applyMiddleware(thunk);
        store = createStore(stateReducer, middleware);
    });

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

describe('Layer actions', () => {

    let store = null;

    beforeEach(function () {
        const middleware = applyMiddleware(thunk);
        store = createStore(stateReducer, middleware);
    });

    it('setSelectedLayerId', () => {
        store.dispatch(actions.setSelectedLayerId('var2'));
        expect(store.getState().control.selectedLayerId).to.equal('var2');
        store.dispatch(actions.setSelectedLayerId(null));
        expect(store.getState().control.selectedLayerId).to.be.null;
    });

    it('addLayer', () => {
        store.dispatch(actions.addLayer({id: 'layer-2', name: 'L2', show: true} as LayerState));
        expect(store.getState().data.layers).to.deep.equal([
            {id: 'selectedVariable', name: null, show: true, type: 'VariableImage'},
            {id: 'layer-2', name: 'L2', show: true},
        ]);
    });

    it('removeLayer', () => {
        store.dispatch(actions.addLayer({id: 'layer-1', name: 'L1', show: true} as LayerState));
        store.dispatch(actions.addLayer({id: 'layer-2', name: 'L2', show: true} as LayerState));
        store.dispatch(actions.removeLayer('layer-2'));
        expect(store.getState().data.layers).to.deep.equal([
            {id: 'selectedVariable', name: null, show: true, type: 'VariableImage'},
            {id: 'layer-1', name: 'L1', show: true},
        ]);
    });

    it('updateLayer', () => {
        store.dispatch(actions.addLayer({id: 'layer-1', name: 'L1', show: true} as LayerState));
        store.dispatch(actions.addLayer({id: 'layer-2', name: 'L2', show: true} as LayerState));
        store.dispatch(actions.addLayer({id: 'layer-3', name: 'L3', show: true} as LayerState));
        store.dispatch(actions.updateLayer({id: 'layer-2', show: false} as LayerState));
        expect(store.getState().data.layers).to.deep.equal([
            {id: 'selectedVariable', name: null, show: true, type: 'VariableImage'},
            {id: 'layer-1', name: 'L1', show: true},
            {id: 'layer-2', name: 'L2', show: false},
            {id: 'layer-3', name: 'L3', show: true},
        ]);
        store.dispatch(actions.updateLayer({id: 'layer-1', name: 'LX'} as LayerState));
        expect(store.getState().data.layers).to.deep.equal([
            {id: 'selectedVariable', name: null, show: true, type: 'VariableImage'},
            {id: 'layer-1', name: 'LX', show: true},
            {id: 'layer-2', name: 'L2', show: false},
            {id: 'layer-3', name: 'L3', show: true},
        ]);
    });

    // setShowSelectedVariableLayer
    it('setShowSelectedVariableLayer', () => {
        store.dispatch(actions.setShowSelectedVariableLayer(true));
        expect(store.getState().session.showSelectedVariableLayer).to.equal(true);
        expect(store.getState().data.layers).to.deep.equal([
            {id: 'selectedVariable', name: null, show: true, type: 'VariableImage'},
        ]);

        store.dispatch(actions.setShowSelectedVariableLayer(false));
        expect(store.getState().session.showSelectedVariableLayer).to.equal(false);
        expect(store.getState().data.layers).to.deep.equal([
            {id: 'selectedVariable', name: null, show: false, type: 'VariableImage'},
        ]);
    });
});
