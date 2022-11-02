import React, { FC, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Redirect } from 'react-router';
import { Link } from 'react-router-dom';

import FormButton from '../../components/common/FormButton';
import PasswordInput from '../../components/common/PasswordInput';
import { setAuthorizedByPassword } from '../../redux/reducers/security';
import { currentTargetValue, forkEvent } from '../../shared/lib/forms/selectors';
import { decryptWallet } from './lib/encryption';
import { getBackUrl } from './lib/redirect';
import { isPasswordValid } from './lib/validate';
import { Wrapper, Title, Password, Footer } from './ui';


const ENTER_KEY = 'Enter';

type EnterPasswordActions = {
    setAuthorized: (enable: boolean) => void;
}

const EnterPassword: FC<EnterPasswordActions> = ({
    setAuthorized,
}) => {
    const { t } = useTranslation();

    const [shouldRedirect, setRedirect] = useState(false);
    const [isError, setIsError] = useState(false);
    const [password, setPassword] = useState('');

    const disableError = useCallback(() => setIsError(false), []);

    const handleSubmit = useCallback(async () => {
        if (!await isPasswordValid(password)) {
            setIsError(true);

            return;
        }

        decryptWallet(password);

        disableError();
        setAuthorized(true);
        setRedirect(true);
    }, [password]);

    const handleKeyPress = useCallback((event: KeyboardEvent) => {
        if (event.key === ENTER_KEY) {
            handleSubmit();
        }
    }, [handleSubmit]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyPress);

        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [handleKeyPress]);

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
        <Wrapper className='small-centered border'>
            <Title>{t('enterPassword.title')}</Title>
            <Password>
                <PasswordInput
                    error={isError && t('enterPassword.error')}
                    placeholder='Password'
                    value={password}
                    onChange={forkEvent(
                        currentTargetValue(setPassword),
                        disableError
                    )}
                />
            </Password>
            <FormButton
                color='light-gray-gray'
                type='button'
                onClick={handleSubmit}>
                {t('enterPassword.unlockCaption')}
            </FormButton>

            <Footer>
                {t('enterPassword.forgotPassword')}
                <Link to='/recover-seed-phrase'>
                    {t('enterPassword.restoreLink')}
                </Link>
            </Footer>
        </Wrapper>
    );
};

const mapDispatchToProps = (dispatch) => ({
    setAuthorized: (enable: boolean) =>
        dispatch(setAuthorizedByPassword(enable))
});

export default connect(null, mapDispatchToProps)(EnterPassword);
