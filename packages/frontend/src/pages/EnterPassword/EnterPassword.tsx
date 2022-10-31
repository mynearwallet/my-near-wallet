import React, {FC, useCallback, useState} from 'react';
import { Link } from 'react-router-dom';

import { StyledContainer, StyledFooter } from './ui';
import PasswordInput from "../../components/common/PasswordInput";
import {currentTargetValue} from "../../shared/lib/forms/selectors";
import FormButton from '../../components/common/FormButton';
import {useTranslation} from "react-i18next";
import styled from "styled-components";
import {KEY_ACTIVE_ACCOUNT_ID, KEYSTORE_PREFIX} from "../../utils/wallet";
// import CONFIG from "../../config";
// import * as nearApiJs from "near-api-js";
// import {createKeyFrom, EncrytedLocalStorage} from "../../utils/keyEncryption";
// import { redirectTo } from '../redux/actions/account';


const Title = styled.h1`
    
`;

const EnterPassword: FC = () => {
    const { t } = useTranslation();

    // const [isError, setIsError] = useState(false);
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = useCallback(() => {
        const activeAccountId = localStorage.getItem(KEY_ACTIVE_ACCOUNT_ID);
        // const accountSecretKey = `${KEYSTORE_PREFIX}${activeAccountId}:${CONFIG.NETWORK_ID}`;
        // const key = localStorage.getItem(accountSecretKey);

        // const keyStore = new nearApiJs.keyStores.BrowserLocalStorageKeyStore(
        //     new EncrytedLocalStorage(createKeyFrom(password)),
        //     KEYSTORE_PREFIX
        // );
        //
        // const keyPair = keyStore.getKey(CONFIG.NETWORK_ID, activeAccountId);
        // console.log(keyPair);





    }, [password]);

    return (
        <StyledContainer className='small-centered border'>

            <Title>{t('enterPassword.title')}</Title>

            <PasswordInput
                // disabled={disabled}
                // error={shouldShowConfirmError ? t('setupPasswordProtection.matchError'): ''}
                // placeholder={t('setupPasswordProtection.confirm')}
                value={password}
                onChange={currentTargetValue(setPassword)}
                // onBlur={handleConfirmBlur}
            />
            <FormButton type="submit" disabled={isLoading} onClick={handleSubmit}>
                {t('enterPassword.unlockBtn')}
            </FormButton>

            <StyledFooter>
                {t('enterPassword.forgotPas')}
                <Link onClick={console.log} to="/recover-seed-phrase">
                    {t('enterPassword.restoreLink')}
                </Link>
            </StyledFooter>
        </StyledContainer>
    );
};

export default EnterPassword;
