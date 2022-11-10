import React, { FC, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Redirect } from 'react-router';

import EnterPasswordForm from '../../components/accounts/EnterPasswordForm';
import Container from '../../components/common/styled/Container.css';
import { setAuthorizedByPassword } from '../../redux/reducers/security';
import { getBackUrl } from '../../utils/url';
import { decryptWallet } from './lib/encryption';


type EnterPasswordActions = {
    setAuthorized: (enable: boolean) => void;
}

const EnterPassword: FC<EnterPasswordActions> = ({
    setAuthorized,
}) => {
    const { t } = useTranslation();
    const [redirectUrl, setRedirectUrl] = useState('');

    const handleValidPassword = useCallback((password: string) => {
        decryptWallet(password);
        setAuthorized(true);
        setRedirectUrl(getBackUrl(location.search));
    }, []);

    if (redirectUrl.length > 0) {
        return (
            <Redirect
                to={{
                    pathname: redirectUrl,
                }}
            />
        );
    }

    return (
        <Container className='small-centered border'>
            <EnterPasswordForm
                title={t('enterPassword.title')}
                onValidPassword={handleValidPassword}
            />
        </Container>
    );
};

const mapDispatchToProps = (dispatch) => ({
    setAuthorized: (enable: boolean) =>
        dispatch(setAuthorizedByPassword(enable))
});

export default connect(null, mapDispatchToProps)(EnterPassword);
