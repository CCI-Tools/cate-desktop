import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Store, createStore, Middleware, applyMiddleware} from 'redux';
import {createLogger} from 'redux-logger';
import thunkMiddleware from 'redux-thunk';
import {Provider} from 'react-redux';
import {State} from "./state";
import {stateReducer} from "./reducers";
import {SetupContainer} from "./containers/SetupContainer";
import * as actions from "./actions";
import {ipcRenderer} from "electron";
import {SetupInfo} from "../../common/setup";

import 'normalize.css/normalize.css';
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '@blueprintjs/table/lib/css/table.css';

export function main() {
    const middlewares: Middleware[] = [thunkMiddleware];

    if (process.env.NODE_ENV === 'development') {
        const loggerOptions = {
            level: 'info',
            collapsed: true,
            diff: true,
        };
        middlewares.push(createLogger(loggerOptions));
    }

    const middleware = applyMiddleware(...middlewares);
    const store = createStore(stateReducer, middleware) as Store<State>;

    ReactDOM.render(
        <Provider store={store}>
            <SetupContainer/>
        </Provider>,
        document.getElementById('container')
    );

    ipcRenderer.on('setSetupInfo', (event, setupInfo: SetupInfo) => {
        store.dispatch(actions.setSetupInfo(setupInfo));
    });
}



