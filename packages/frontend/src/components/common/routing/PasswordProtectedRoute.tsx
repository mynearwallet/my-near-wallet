import React from 'react';
import { connect, useSelector } from 'react-redux';
import { Route, withRouter } from 'react-router-dom';

import { selectAccountSlice } from '../../../redux/slices/account';
import { selectPasswordProtectionSlice } from '../../../redux/slices/passwordProtectedWallet/passwordProtectedWallet';
import { selectStatusLocalAlert } from '../../../redux/slices/status';
import { KEY_ACTIVE_ACCOUNT_ID } from '../../../utils/wallet';
import { SetPasswordPage } from '../../accounts/password_encryption/SetPasswordPage';
import { UnlockWalletPage } from '../../accounts/password_encryption/UnlockWalletPage';
import NoIndexMetaTag from '../NoIndexMetaTag';

// Password Protected Route for certain routes where users might not have an activated account, and we still want to set up password first
const PasswordProtectedRoute = ({
    component: Component,
    render,
    // account,
    indexBySearchEngines,
    ...rest
}) => {
    const hasAnyAccount = !!localStorage.getItem(KEY_ACTIVE_ACCOUNT_ID);
    const { dataStatus, isSignedIn } = useSelector(selectPasswordProtectionSlice);

    return (
        <>
            {!indexBySearchEngines && <NoIndexMetaTag />}
            <Route
                {...rest}
                render={(props) => {
                    // Step 1: This is a totally new account, redirect them to set up password
                    if (!dataStatus.hasEncryptedData && !hasAnyAccount) {
                        return <SetPasswordPage />;
                        // Step 2: Account exists and opted password encryption but not unlocked yet, need to prompt user to insert password
                    } else if (dataStatus.hasEncryptedData && !isSignedIn) {
                        return (
                            <UnlockWalletPage
                                titleId={'setupPasswordProtection.unlockWalletTitle'}
                                descriptionId={
                                    'setupPasswordProtection.unlockWalletDescription'
                                }
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

export default withRouter(connect(mapStateToProps)(PasswordProtectedRoute));
