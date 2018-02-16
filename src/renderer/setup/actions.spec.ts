import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk'
import {should, expect} from 'chai';
import * as actions from './actions';
import {stateReducer} from './reducers';
import {
    SCREEN_ID_CATE_INSTALL, SCREEN_ID_CONDA_INSTALL, SCREEN_ID_END, SETUP_MODE_AUTO, SETUP_MODE_USER,
    State
} from "./state";

should();

describe('Setup/actions', () => {
    let store = null;

    beforeEach(function () {
        const middleware = applyMiddleware(thunk);
        store = createStore(stateReducer, middleware);
    });

    const getState = (): State => {
        return store.getState();
    };

    const dispatch = (action: any): void => {
        store.dispatch(action);
    };

    describe('can move forward', () => {

        it('can move forward from auto mode', () => {
            expect(getState().setupMode).to.equal(SETUP_MODE_AUTO);
            dispatch(actions.moveForward());
            expect(getState().screenId).to.equal(SCREEN_ID_END);
        });

        it('can move forward from user mode', () => {
            dispatch(actions.setSetupMode(SETUP_MODE_USER));
            dispatch(actions.moveForward());
            expect(getState().screenId).to.equal(SCREEN_ID_CONDA_INSTALL);
            dispatch(actions.moveForward());
            expect(getState().screenId).to.equal(SCREEN_ID_CATE_INSTALL);
            dispatch(actions.moveForward());
            expect(getState().screenId).to.equal(SCREEN_ID_END);
        });
    });
});
