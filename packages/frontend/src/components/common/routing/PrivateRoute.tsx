import React from 'react';
import { connect } from 'react-redux';
import { Route, withRouter, Redirect } from 'react-router-dom';

import { selectAccountSlice } from '../../../redux/slices/account';
import { selectStatusLocalAlert } from '../../../redux/slices/status';
import { KEY_ACTIVE_ACCOUNT_ID } from '../../../utils/wallet';
import NoIndexMetaTag from '../NoIndexMetaTag';
import PasswordProtectedRoute from './PasswordProtectedRoute';

// PrivateRoute is for logged-in users only and will redirect to the guest landing page if there's no active account

const PrivateRoute = ({
    component: Component,
    render,
    account,
    indexBySearchEngines,
    ...rest
}) => {
    return (
        <>
            {!indexBySearchEngines && <NoIndexMetaTag />}
            <Route
                {...rest}
                render={(props) => {
                    // Step 1: Check if there's any account created/imported at all
                    if (!localStorage.getItem(KEY_ACTIVE_ACCOUNT_ID)) {
                        return (
                            <Redirect
                                to={{
                                    pathname: '/',
                                }}
                            />
                        );
                    }

                    return (
                        <PasswordProtectedRoute
                            component={Component}
                            render={render}
                            account={account}
                            index={indexBySearchEngines}
                            {...rest}
                        />
                    );
                }}
            />
        </>
    );
};

const mapStateToProps = (state) => ({
    account: selectAccountSlice(state),
    localAlert: selectStatusLocalAlert(state),
});

export default withRouter(connect(mapStateToProps)(PrivateRoute));
