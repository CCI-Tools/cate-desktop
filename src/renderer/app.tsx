import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {createStore, combineReducers, applyMiddleware} from 'redux';
import * as logger from 'redux-logger';
import {Provider} from 'react-redux';
import {ipcRenderer} from 'electron';
import {Layout} from './components/Layout'
import {WebAPI, JobPromise, openWebAPI, JobResponse, JobProgress, JobFailure, JobStatus, JobRequest, WebSocketMock} from './webapi'



function applyInitialState(initialState) {
    return {type: 'APPLY_INITIAL_STATE', initialState};
}

function setWebapiOpenStatus(status) {
    return {type: 'SET_WEBAPI_OPEN_STATUS', status};
}




const webapiStatusReducer = (state={}, action) => {
    if (action.type === 'SET_WEBAPI_OPEN_STATUS') {
        return Object.assign({}, {status: action.status})
    }
    return state;
};

const appConfigReducer = (state={}, action) => {
    if (action.type === 'APPLY_INITIAL_STATE') {
        return Object.assign({}, action.initialState.appConfig);
    }
    return state;
};

const userPrefsReducer = (state={}, action) => {
    if (action.type === 'APPLY_INITIAL_STATE') {
        return Object.assign({}, action.initialState.userPrefs);
    }
    return state;
};

let webapi:WebAPI = null;

export function main() {

    const reducers = combineReducers({
        webapiStatus: webapiStatusReducer,
        appConfig: appConfigReducer,
        userPrefs: userPrefsReducer,
    });

    const store = createStore(reducers, applyMiddleware(logger()));

    store.subscribe(() => {
        // console.log("store changed: ", store.getState());
    });

    ipcRenderer.on('apply-initial-state', (event, initialState) => {
        store.dispatch(applyInitialState(initialState));

        const webapiConfig = initialState.appConfig.webapiConfig;
        if (webapiConfig.disabled !== true && webapiConfig.webSocketUrl) {
            webapi = openWebAPI(webapiConfig.webSocketUrl);
        } else {
            webapi = openWebAPI('ws://mock', 0, new WebSocketMock());
        }

        store.dispatch(setWebapiOpenStatus('connecting'));
        webapi.onOpen = () => {
            store.dispatch(setWebapiOpenStatus('open'));
        };
        webapi.onClose = () => {
            store.dispatch(setWebapiOpenStatus('closed'));
        };
        webapi.onError = () => {
            store.dispatch(setWebapiOpenStatus('error'));
        };
    });

    ReactDOM.render(
        <Provider store={store}>
            <Layout/>
        </Provider>,
        document.getElementById('container')
    );
}
