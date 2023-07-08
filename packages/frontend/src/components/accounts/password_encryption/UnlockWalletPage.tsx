import React, { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Translate } from 'react-localize-redux';
import { useDispatch } from 'react-redux';

import passwordEncryptionSlice, {
    TDecryptedData_Account,
} from '../../../redux/slices/passwordEncryption/passwordEncryptionSlice';
import { currentTargetValue } from '../../../shared/lib/forms/selectors';
import { EncryptionDecryptionUtils } from '../../../utils/encryption';
import { getEncryptedData } from '../../../utils/localStorage';
import { wallet } from '../../../utils/wallet';
import FormButton from '../../common/FormButton';
import Container from '../../common/styled/Container.css';
import Input from './SetPassword/ui/Input';
import { Submit } from './SetPasswordForm/ui';

type UnlockWalletPageProps = {
    uponUnlock: () => void;
};

export const UnlockWalletPage: FC<UnlockWalletPageProps> = ({ uponUnlock }) => {
    const { t } = useTranslation();
    const [password, setPassword] = useState<string>(null);
    const [errorMessage, setErrorMessage] = useState<string>(null);
    const dispatch = useDispatch();

    // TODO-password-encryption: Change this to the real decrypt function
    const unlockHandler = async () => {
        try {
            // Step 1: Get encrypted data from local storage
            const encryptedData = getEncryptedData();
            const { salt, encryptedData: encryptedDataString } = encryptedData;

            // Step 2: Hash and get derived password, then use it to decrypt the data
            const derivedPassword = await EncryptionDecryptionUtils.generateHash(
                password
            );
            const decryptedAccounts = await EncryptionDecryptionUtils.decrypt(
                derivedPassword,
                salt,
                encryptedDataString
            );

            // Step 3: Save the accounts in the redux store, but is this really necessary?
            dispatch(
                passwordEncryptionSlice.actions.decrypt({
                    accounts: decryptedAccounts.decryptedData as TDecryptedData_Account[],
                    derivedPassword,
                })
            );

            // Step 4: Set the key to the wallet InMemoryKeystore for transaction signing
            decryptedAccounts.decryptedData.forEach((account) => {
                wallet.setKey(account.accountId, account.privateKey);
            });

            uponUnlock();
            setErrorMessage(null);
        } catch (e) {
            console.error(e);
            setErrorMessage(t('setupPasswordProtection.invalidPassword'));
        }
    };

    const handleChangePassword = (value: string) => {
        setPassword(value);
    };

    return (
        <Container className='small-centered border'>
            <div>
                <h1>
                    <Translate id='setupPasswordProtection.unlockWalletTitle' />
                </h1>
                <h2>
                    <Translate id='setupPasswordProtection.unlockWalletDescription' />
                </h2>

                <Input
                    placeholder={t(
                        'setupPasswordProtection.unlockWalletInputPlaceholder'
                    )}
                    value={password ?? ''}
                    onChange={currentTargetValue(handleChangePassword)}
                    error={errorMessage}
                />

                <Submit>
                    {/* @ts-ignore: prop error */}
                    <FormButton onClick={unlockHandler} disabled={!password}>
                        {t('setupPasswordProtection.unlockWalletButton')}
                    </FormButton>
                </Submit>
            </div>
        </Container>
    );
};
