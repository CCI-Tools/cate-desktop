import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk'
import {should, expect} from 'chai';
import {SETUP_MODE_AUTO, SETUP_MODE_USER,} from "../../common/setup";
import * as actions from './actions';
import {stateReducer} from './reducers';
import {SCREEN_ID_CATE_INSTALL, SCREEN_ID_END, SCREEN_ID_START, SCREEN_ID_TASK_MONITOR, State} from "./state";

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

    describe('can navigate', () => {

        it('can navigate from auto mode', () => {
            expect(getState().screenId).to.equal(SCREEN_ID_START);
            expect(getState().setupMode).to.equal(SETUP_MODE_AUTO);
            dispatch(actions.moveForward());
            expect(getState().screenId).to.equal(SCREEN_ID_TASK_MONITOR);
            dispatch(actions.moveForward());
            expect(getState().screenId).to.equal(SCREEN_ID_END);
            dispatch(actions.moveBack());
            expect(getState().screenId).to.equal(SCREEN_ID_TASK_MONITOR);
            dispatch(actions.moveBack());
            expect(getState().screenId).to.equal(SCREEN_ID_START);
        });

        it('can navigate from user mode', () => {
            expect(getState().screenId).to.equal(SCREEN_ID_START);
            dispatch(actions.setSetupMode(SETUP_MODE_USER));
            dispatch(actions.moveForward());
            expect(getState().screenId).to.equal(SCREEN_ID_CATE_INSTALL);
            dispatch(actions.moveForward());
            expect(getState().screenId).to.equal(SCREEN_ID_TASK_MONITOR);
            dispatch(actions.moveForward());
            expect(getState().screenId).to.equal(SCREEN_ID_END);
            dispatch(actions.moveBack());
            expect(getState().screenId).to.equal(SCREEN_ID_TASK_MONITOR);
            dispatch(actions.moveBack());
            expect(getState().screenId).to.equal(SCREEN_ID_CATE_INSTALL);
            dispatch(actions.moveBack());
            expect(getState().screenId).to.equal(SCREEN_ID_START);
        });
    });
});
