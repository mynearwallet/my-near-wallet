import React, { FC, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Checkbox from '../../../common/Checkbox';
import FormButton from '../../../common/FormButton';
import SetPassword from '../SetPassword';
import {
    PasswordForm,
    Submit,
    CheckBoxContainer,
    CheckBoxGroup,
    CheckBoxLabel,
    CheckBoxWrapper,
} from './ui';

type SetPasswordFormProps = {
    onSubmit: (password: string) => void;
};

const SetPasswordForm: FC<SetPasswordFormProps> = ({ onSubmit }) => {
    const { t } = useTranslation();
    const [recoveryWarnChecked, setRecoveryWarnChecked] = useState<boolean>(false);
    const [passwordManagerWarnChecked, setPasswordManagerWarnChecked] =
        useState<boolean>(false);
    const [privateComputerWarnChecked, setPrivateComputerWarnChecked] =
        useState<boolean>(false);
    const [password, setPassword] = useState(null);

    const handlePasswordChange = useCallback((value) => {
        setPassword(value);
    }, []);

    const handleClickNext = useCallback(() => {
        if (password) {
            onSubmit(password);
        }
    }, [password]);

    const submitDisabled: boolean =
        password === null ||
        !recoveryWarnChecked ||
        !passwordManagerWarnChecked ||
        !privateComputerWarnChecked;

    return (
        <>
            <PasswordForm>
                <SetPassword onChange={handlePasswordChange} />
                <CheckBoxGroup>
                    <CheckBoxContainer>
                        <CheckBoxWrapper
                            onClick={() => setRecoveryWarnChecked((prev) => !prev)}
                        >
                            <Checkbox className='' checked={recoveryWarnChecked} />
                        </CheckBoxWrapper>
                        <CheckBoxLabel>
                            {t('setupPasswordProtection.warn.recovery')}
                        </CheckBoxLabel>
                    </CheckBoxContainer>
                    <CheckBoxContainer>
                        <CheckBoxWrapper
                            onClick={() => setPasswordManagerWarnChecked((prev) => !prev)}
                        >
                            <Checkbox className='' checked={passwordManagerWarnChecked} />
                        </CheckBoxWrapper>
                        <CheckBoxLabel>
                            {t('setupPasswordProtection.warn.passwordManager')}
                        </CheckBoxLabel>
                    </CheckBoxContainer>
                    <CheckBoxContainer>
                        <CheckBoxWrapper
                            onClick={() => setPrivateComputerWarnChecked((prev) => !prev)}
                        >
                            <Checkbox className='' checked={privateComputerWarnChecked} />
                        </CheckBoxWrapper>
                        <CheckBoxLabel>
                            {t('setupPasswordProtection.warn.privateComputer')}
                        </CheckBoxLabel>
                    </CheckBoxContainer>
                </CheckBoxGroup>
            </PasswordForm>
            <Submit>
                {/* @ts-ignore: prop error */}
                <FormButton onClick={handleClickNext} disabled={submitDisabled}>
                    {t('button.next')}
                </FormButton>
            </Submit>
            {/*<WithoutPassword hide={false}>*/}
            {/*    {t('setupPasswordProtection.withoutPassword')}*/}
            {/*</WithoutPassword>*/}
        </>
    );
};

export default SetPasswordForm;
