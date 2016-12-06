import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Store, createStore, combineReducers, applyMiddleware} from 'redux';
import * as loggerMiddleware from 'redux-logger';
import {Provider} from 'react-redux';
import {ipcRenderer} from 'electron';
import {Layout} from './components/Layout'
import {newWebAPIClient, WebSocketMock, WebAPIServiceMock} from './webapi'
import {OperationAPI} from "./webapi/apis/OperationAPI";
import {DatasetAPI} from "./webapi/apis/DatasetAPI";
import {State, DataStoreState} from './state';
import * as actions from './actions'
import {reducers} from './reducers';

//noinspection JSUnusedGlobalSymbols
export function main() {

    const middleware = applyMiddleware(loggerMiddleware({level: 'info', collapsed: true}));
    const store = createStore(reducers, middleware);

    ipcRenderer.on('apply-initial-state', (event, initialState) => {
        store.dispatch(actions.applyInitialState(initialState));
        connectWebAPIClient(store);
    });

    ReactDOM.render(
        <Provider store={store}>
            <Layout/>
        </Provider>,
        document.getElementById('container')
    );
}

function connectWebAPIClient(store: Store<State>) {
    store.dispatch(actions.setWebAPIStatus(null, 'connecting'));

    const webAPIConfig = store.getState().data.appConfig.webAPIConfig;
    console.log('webAPIConfig:', webAPIConfig);
    let webAPIClient;
    if (webAPIConfig.disabled !== true && webAPIConfig.webSocketUrl) {
        webAPIClient = newWebAPIClient(webAPIConfig.webSocketUrl);
    } else {
        webAPIClient = newWebAPIClient('ws://mock', 0, new WebSocketMock(100, new WebAPIServiceMock()));
    }

    // TODO (nf): this code can take considerable time and is executed BEFORE the window UI shows up
    //            we urgently need to display some progress indicator beforehand.
    webAPIClient.onOpen = () => {
        store.dispatch(actions.setWebAPIStatus(webAPIClient, 'open'));
        const datasetAPI = new DatasetAPI(webAPIClient);
        const operationAPI = new OperationAPI(webAPIClient);

        // Get data stores from remote
        datasetAPI.getDataStores().then((dataStores: Array<DataStoreState>) => {
            store.dispatch(actions.updateDataStores(dataStores));
            const selectedDataStoreId = store.getState().control.selectedDataStoreId;
            if (dataStores && selectedDataStoreId) {
                const dataStore = dataStores.find(dataStore => dataStore.id === selectedDataStoreId);
                if (dataStore && !dataStore.dataSources) {

                    // Get data sources from remote
                    datasetAPI.getDataSources(dataStore.id).then(dataSources => {
                        store.dispatch(actions.updateDataSources(dataStore.id, dataSources));
                    }).catch(error => {
                        // what to do?
                        console.error(error);
                    });
                }
            }
        });

        // Get operations from remote
        operationAPI.getOperations().then(operations => {
            store.dispatch(actions.updateOperations(operations));
        });
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
