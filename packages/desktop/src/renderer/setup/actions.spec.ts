import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk'
import { expect, should } from 'chai';
import { CATE_MODE_NEW_CATE_DIR, SETUP_MODE_AUTO, SETUP_MODE_USER, } from '../../common/setup';
import * as actions from './actions';
import { stateReducer } from './reducers';
import {
    SCREEN_ID_CONFIG,
    SCREEN_ID_END,
    SCREEN_ID_RUN,
    SCREEN_ID_START,
    SETUP_STATUS_IN_PROGRESS,
    SETUP_STATUS_NOT_STARTED,
    SETUP_STATUS_SUCCEEDED,
    State
} from './state';

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
            expect(getState().setupStatus).to.equal(SETUP_STATUS_NOT_STARTED);
            expect(getState().setupMode).to.equal(SETUP_MODE_AUTO);
            dispatch(actions.moveForward());
            expect(getState().screenId).to.equal(SCREEN_ID_RUN);
            dispatch(actions.setSetupStatus(SETUP_STATUS_SUCCEEDED));
            dispatch(actions.moveForward());
            expect(getState().screenId).to.equal(SCREEN_ID_END);
            dispatch(actions.moveBack());
            expect(getState().screenId).to.equal(SCREEN_ID_RUN);
            dispatch(actions.moveBack());
            expect(getState().screenId).to.equal(SCREEN_ID_RUN); // Ok, we cannot go behind RUN screen
        });

        it('can navigate from user mode', () => {
            expect(getState().screenId).to.equal(SCREEN_ID_START);
            expect(getState().setupStatus).to.equal(SETUP_STATUS_NOT_STARTED);
            dispatch(actions.setSetupMode(SETUP_MODE_USER));
            dispatch(actions.moveForward());
            expect(getState().screenId).to.equal(SCREEN_ID_CONFIG);
            dispatch(actions.setCateMode(CATE_MODE_NEW_CATE_DIR));
            dispatch(actions.setNewCateDir('/home/bibo/cate-2.0'));
            dispatch(actions.moveForward());
            expect(getState().screenId).to.equal(SCREEN_ID_RUN);
            expect(getState().setupStatus).to.equal(SETUP_STATUS_IN_PROGRESS);
            dispatch(actions.setSetupStatus(SETUP_STATUS_SUCCEEDED));
            dispatch(actions.moveForward());
            expect(getState().screenId).to.equal(SCREEN_ID_END);
            dispatch(actions.moveBack());
            expect(getState().screenId).to.equal(SCREEN_ID_RUN);
            dispatch(actions.moveBack());
            expect(getState().screenId).to.equal(SCREEN_ID_RUN); // Ok, we cannot go behind RUN screen
        });
    });
});


