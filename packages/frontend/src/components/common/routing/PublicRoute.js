import React from 'react';
import { Route, Redirect } from 'react-router-dom';

import { getActiveAccountId } from '../../../utils/account';
import NoIndexMetaTag from '../NoIndexMetaTag';

// PublicRoute is for guest users only and will redirect to dashboard if there is an active account

const PublicRoute = ({
    component,
    path,
    render,
    indexBySearchEngines
}) => (
    <>
        {!indexBySearchEngines && <NoIndexMetaTag />}
        {getActiveAccountId() ? (
            <Redirect
                to='/'
            />
        ) : (
            <Route
                exact
                path={path}
                component={component}
                render={render}
            />
        )}
    </>
);

export default PublicRoute;
