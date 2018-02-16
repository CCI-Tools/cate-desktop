import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Store, createStore, Middleware, applyMiddleware} from 'redux';
import {createLogger} from 'redux-logger';
import thunkMiddleware from 'redux-thunk';
import {Provider} from 'react-redux';
import {ipcRenderer} from 'electron';
import {State} from "./state";
import {stateReducer} from "./reducers";
import {ApplicationPage} from "./ApplicationPage";



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
                <ApplicationPage/>
            </Provider>,
            document.getElementById('container')
        );
}



