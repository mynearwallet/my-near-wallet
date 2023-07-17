import React, { FC, useState } from 'react';
import { Translate } from 'react-localize-redux';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router';

import { selectDerivedPassword } from '../../../redux/slices/passwordEncryption/passwordEncryptionSlice';
import { EncryptionDecryptionUtils } from '../../../utils/encryption';
import { wallet } from '../../../utils/wallet';
import FormButton from '../../common/FormButton';
import Container from '../../common/styled/Container.css';
import SetPasswordForm from './SetPasswordForm';
import { Submit } from './SetPasswordForm/ui';
import { UnlockWalletPage } from './UnlockWalletPage';

type ChangePasswordPageProps = {};

export const ChangePasswordPage: FC<ChangePasswordPageProps> = () => {
    const history = useHistory();
    const derivedPassword = useSelector(selectDerivedPassword);

    const [password, setPassword] = useState<string>('');
    const [isPasswordMatch, setIsPasswordMatch] = useState<boolean>(false);
    const [isCompleted, setIsCompleted] = useState<boolean>(false);

    const reinsertOldPasswordHandler = async (password) => {
        const insertedDerivedPassword = await EncryptionDecryptionUtils.generateHash(
            password
        );

        if (insertedDerivedPassword === derivedPassword) {
            setIsPasswordMatch(true);
            setPassword(password);
        }
    };

    const handleUpdatePassword = async (newPassword: string) => {
        await wallet.changeEncryptionPassword(password, newPassword);
        setIsCompleted(true);
    };

    const completePasswordUpdateHandler = () => {
        history.push('/');
    };

    return (
        <>
            {!isPasswordMatch ? (
                // Step 1: Confirm Password
                <UnlockWalletPage
                    titleId={'setupPasswordProtection.changePassword.step1Title'}
                    descriptionId={
                        'setupPasswordProtection.changePassword.step1Description'
                    }
                    uponUnlock={reinsertOldPasswordHandler}
                />
            ) : // Step 2: Set New Password
            !isCompleted ? (
                <Container className='small-centered border'>
                    <h1>
                        <Translate id='setupPasswordProtection.changePassword.step2Title' />
                    </h1>
                    <h2>
                        <Translate id='setupPasswordProtection.changePassword.step2Description' />
                    </h2>
                    <SetPasswordForm onSubmit={handleUpdatePassword} />
                </Container>
            ) : (
                // Step 3: Completed password update
                <Container className='small-centered border'>
                    <h1>
                        <Translate id='setupPasswordProtection.changePassword.completedTitle' />
                    </h1>
                    <h2>
                        <Translate id='setupPasswordProtection.changePassword.completedDescription' />
                    </h2>
                    <Submit>
                        {/*@ts-ignore*/}
                        <FormButton onClick={completePasswordUpdateHandler}>
                            <Translate id='setupPasswordProtection.setPasswordSuccessfullyButton' />
                        </FormButton>
                    </Submit>
                </Container>
            )}
        </>
    );
};
