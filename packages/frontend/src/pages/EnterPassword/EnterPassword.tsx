import React, { FC, useCallback, useState } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router';

import EnterPasswordForm from '../../components/accounts/EnterPasswordForm';
import Container from '../../components/common/styled/Container.css';
import { setAuthorizedByPassword } from '../../redux/reducers/security';
import { decryptWallet } from './lib/encryption';
import { getBackUrl } from './lib/redirect';


type EnterPasswordActions = {
    setAuthorized: (enable: boolean) => void;
}

const EnterPassword: FC<EnterPasswordActions> = ({
    setAuthorized,
}) => {
    const [shouldRedirect, setRedirect] = useState(false);

    const handleValidPassword = useCallback((password: string) => {
        decryptWallet(password);
        setAuthorized(true);
        setRedirect(true);
    }, []);

    if (shouldRedirect) {
        return (
            <Redirect
                to={{
                    pathname: getBackUrl(location.search),
                }}
            />
        );
    }

    return (
        <Container className='small-centered border'>
            <EnterPasswordForm onValidPassword={handleValidPassword} />
        </Container>
    );
};

const mapDispatchToProps = (dispatch) => ({
    setAuthorized: (enable: boolean) =>
        dispatch(setAuthorizedByPassword(enable))
});

export default connect(null, mapDispatchToProps)(EnterPassword);
