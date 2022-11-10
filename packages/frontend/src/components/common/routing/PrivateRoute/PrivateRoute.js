import React, {useCallback, useEffect, useState} from 'react';
import { connect } from 'react-redux';
import { Route, withRouter, Redirect } from 'react-router-dom';

import { setAuthorizedByPassword } from '../../../../redux/reducers/security';
import { selectAccountSlice } from '../../../../redux/slices/account';
import { selectStatusLocalAlert } from '../../../../redux/slices/status';
import { getActiveAccountId } from '../../../../utils/account';
import { isEncrypted } from '../../../../utils/encryption/keys';
import NoIndexMetaTag from '../../NoIndexMetaTag';

const DEAUTH_TIMEOUT = 1000 * 60 * 60;

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
    setAuthorized,
    ...rest
}) => {
    const [inactivityTimer, setInactivityTimer] = useState(null);

    const handleFocus = useCallback(() => {
        clearTimeout(inactivityTimer);
        setInactivityTimer(null);
    }, [inactivityTimer]);

    const handleBlur = useCallback(() => {
        setInactivityTimer(setTimeout(() => {
            setAuthorized(false);
        }, DEAUTH_TIMEOUT));
    }, [inactivityTimer]);

    useEffect(() => {
        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, [handleFocus, handleBlur]);

    return (
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
                                        search: encodeURIComponent(location.pathname)
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
};

const mapStateToProps = (state) => ({
    isAuthorizedByPassword: state.security.isAuthorizedByPassword,
    account: selectAccountSlice(state),
    localAlert: selectStatusLocalAlert(state)
});

const mapDispatchToProps = {
    setAuthorized: setAuthorizedByPassword
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PrivateRoute));
