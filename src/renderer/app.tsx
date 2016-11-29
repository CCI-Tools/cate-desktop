import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {createStore, combineReducers, applyMiddleware} from 'redux';
import * as logger from 'redux-logger';
import {Provider} from 'react-redux';
import {ipcRenderer} from 'electron';
import {Layout} from './components/Layout'
import {WebAPI, openWebAPI, WebSocketMock, WebAPIServiceMock} from './webapi'



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

let webAPI = null;

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
        store.dispatch(setWebapiOpenStatus('connecting'));

        const webapiConfig = initialState.appConfig.webapiConfig;
        if (webapiConfig.disabled !== true && webapiConfig.webSocketUrl) {
            webAPI = openWebAPI(webapiConfig.webSocketUrl);
        } else {
            webAPI = openWebAPI('ws://mock', 0, new WebSocketMock(100, new WebAPIServiceMock()));
        }

        webAPI.onOpen = () => {
            store.dispatch(setWebapiOpenStatus('open'));
        };
        webAPI.onClose = () => {
            store.dispatch(setWebapiOpenStatus('closed'));
        };
        webAPI.onError = () => {
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
