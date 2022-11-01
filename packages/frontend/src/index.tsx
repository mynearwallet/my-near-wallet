import 'regenerator-runtime/runtime';

import { createBrowserHistory } from 'history';
import React from 'react';
import ReactDOM from 'react-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3-near';
import { LocalizeProvider } from 'react-localize-redux';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import App from './app';
import CONFIG from './config';
import createRootReducer from './redux/createReducers';
import createMiddleware from './redux/middleware';
import initSentry from './utils/sentry';
import './translations';

initSentry();

const history = createBrowserHistory();

export const store = createStore(createRootReducer(history), createMiddleware(history));

// @ts-ignore TODO fake property
store.addAccountReducer = () => {
    store.replaceReducer(createRootReducer(history));
};

ReactDOM.render(
    <GoogleReCaptchaProvider
        reCaptchaKey={CONFIG.RECAPTCHA_ENTERPRISE_SITE_KEY}
        useRecaptchaNet={true}
        useEnterprise={true}
    >
        <Provider store={store}>
            <LocalizeProvider store={store}>
                <App history={history}/>
            </LocalizeProvider>
        </Provider>
    </GoogleReCaptchaProvider>,
    document.getElementById('root')
);
