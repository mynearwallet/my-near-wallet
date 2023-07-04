import React from 'react';
import { connect } from 'react-redux';
import { Route, withRouter, Redirect } from 'react-router-dom';

import { selectAccountSlice } from '../../../redux/slices/account';
import { selectStatusLocalAlert } from '../../../redux/slices/status';
import { getEncryptedData } from '../../../utils/localStorage';
import { KEY_ACTIVE_ACCOUNT_ID } from '../../../utils/wallet';
import { UnlockWalletPage } from '../../accounts/password_encryption/UnlockWalletPage';
import NoIndexMetaTag from '../NoIndexMetaTag';

// PrivateRoute is for logged-in users only and will redirect to the guest landing page if there's no active account

const PrivateRoute = ({
    component: Component,
    render,
    account,
    indexBySearchEngines,
    ...rest
}) => {
    const isAccountEncrypted = !!getEncryptedData();
    const isAccountUnlocked = false;

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
                    // Step 2: Account exists and opted password encryption but not unlocked yet, need to prompt user to insert password
                    if (isAccountEncrypted && !isAccountUnlocked) {
                        return (
                            <UnlockWalletPage
                                uponUnlock={() => console.log('unlocked')}
                            />
                        );
                    }

                    // Step 3: <Route component> takes precedence over <Route render></Route>
                    if (Component) {
                        return <Component {...props} />;
                    }

                    // Step 4: Render prop comes the last
                    if (render) {
                        return render(props);
                    }

                    return <></>;
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
