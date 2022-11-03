import React from 'react';
import { connect } from 'react-redux';
import { Route, withRouter, Redirect } from 'react-router-dom';

import { selectAccountSlice } from '../../../../redux/slices/account';
import { selectStatusLocalAlert } from '../../../../redux/slices/status';
import { getActiveAccountId } from '../../../../utils/account';
import { isEncrypted } from '../../../../utils/encryption/keys';
import NoIndexMetaTag from '../../NoIndexMetaTag';


/**
 * PrivateRoute is for logged in users only and will redirect to the guest landing page
 * if there's no active account or to enter password page if private key is encrypted
 */
const PrivateRoute = ({
    component: Component,
    render,
    account,
    indexBySearchEngines,
    isAuthorizedByPassword,
    ...rest
}) => (
    <>
        {!indexBySearchEngines && <NoIndexMetaTag />}
        <Route
            render={(props) => {
                if (!getActiveAccountId()) {
                    return (
                        <Redirect
                            to={{
                                pathname: '/',
                            }}
                        />
                    );
                }

                const isBlockedByPassword = isEncrypted() && !isAuthorizedByPassword;
                if (isBlockedByPassword) {
                    // Avoid infinite loop of redirect
                    const skipRedirect = location.pathname === '/enter-password';

                    if (!skipRedirect) {
                        return (
                            <Redirect
                                to={{
                                    pathname: '/enter-password',
                                    search: window.btoa(location.pathname)
                                }}
                            />
                        );
                    }
                }

                // <Route component> takes precedence over <Route render></Route>
                if (Component) {
                    return <Component {...props} />;
                }

                if (render) {
                    return render(props);
                }

                return (<></>);
            }}
        />
    </>
);

const mapStateToProps = (state) => ({
    isAuthorizedByPassword: state.security.isAuthorizedByPassword,
    account: selectAccountSlice(state),
    localAlert: selectStatusLocalAlert(state)
});

export default withRouter(connect(mapStateToProps)(PrivateRoute));
