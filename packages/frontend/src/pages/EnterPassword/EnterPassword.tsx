import React, { FC, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Redirect } from 'react-router';

import EnterPasswordForm from '../../components/accounts/EnterPasswordForm';
import Container from '../../components/common/styled/Container.css';
import { setAuthorizedByPassword } from '../../redux/reducers/security';
import { removeAllAccounts } from './lib/accounts';
import { decryptWallet } from './lib/encryption';
import { getBackUrl } from './lib/redirect';


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

    const handleRestore = useCallback(async () => {
        await removeAllAccounts();
        setRedirectUrl('/recover-seed-phrase');
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
                onRestore={handleRestore} />
        </Container>
    );
};

const mapDispatchToProps = (dispatch) => ({
    setAuthorized: (enable: boolean) =>
        dispatch(setAuthorizedByPassword(enable))
});

export default connect(null, mapDispatchToProps)(EnterPassword);
