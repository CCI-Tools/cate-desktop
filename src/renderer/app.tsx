import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Store, createStore, applyMiddleware} from 'redux';
import * as loggerMiddleware from 'redux-logger';
import thunkMiddleware from 'redux-thunk';
import {Provider} from 'react-redux';
import {ipcRenderer} from 'electron';
import {Layout} from './components/Layout'
import {newWebAPIClient, WebSocketMock, WebAPIServiceMock} from './webapi'
import {State} from './state';
import * as actions from './actions'
import {reducers} from './reducers';

//noinspection JSUnusedGlobalSymbols
export function main() {

    const middleware = applyMiddleware(
        loggerMiddleware({level: 'info', collapsed: true}),
        thunkMiddleware
    );

    const store = createStore(reducers, middleware);

    ipcRenderer.on('apply-initial-state', (event, initialState) => {
        store.dispatch(actions.applyInitialState(initialState));
        connectWebAPIClient(store);
    });
}

function connectWebAPIClient(store: Store<State>) {
    store.dispatch(actions.setWebAPIStatus(null, 'connecting'));

    const webAPIConfig = store.getState().data.appConfig.webAPIConfig;
    console.log('webAPIConfig:', webAPIConfig);
    let webAPIClient;
    if (!webAPIConfig.useMockService && webAPIConfig.webSocketUrl) {
        webAPIClient = newWebAPIClient(webAPIConfig.webSocketUrl);
    } else {
        webAPIClient = newWebAPIClient('ws://mock', 0, new WebSocketMock(100, new WebAPIServiceMock(), true));
    }

    // TODO (nf): this code can take considerable time and is executed BEFORE the window UI shows up
    //            we urgently need to display some progress indicator beforehand.
    webAPIClient.onOpen = () => {
        store.dispatch(actions.setWebAPIStatus(webAPIClient, 'open'));
        store.dispatch(actions.loadDataStores());
        store.dispatch(dispatch => {
            setTimeout(() => {
                dispatch({type: 'BRING_KINDERSCHOKOLADE', payload: 'Here are 5kg Kinderschokolade'});
            }, 5000);
        });

        // TODO: dispatch actions
        // - load data stores
        //   - set selected data store (if any)
        //     - load data sources
        //       - set selected data source (if any)
        // - load operations
        // - load current workspace

        ReactDOM.render(
            <Provider store={store}>
                <Layout/>
            </Provider>,
            document.getElementById('container')
        );
    };

    webAPIClient.onClose = () => {
        store.dispatch(actions.setWebAPIStatus(null, 'closed'));
    };

    webAPIClient.onError = () => {
        store.dispatch(actions.setWebAPIStatus(webAPIClient, 'error'));
    };

    webAPIClient.onWarning = (event) => {
        console.warn(`cate-desktop: warning from cate-webapi: ${event.message}`);
    };
}
