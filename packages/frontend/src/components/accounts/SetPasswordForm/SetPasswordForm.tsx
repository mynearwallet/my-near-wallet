import React, { FC, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import FormButton from '../../common/FormButton';
import SetPassword from '../SetPassword';
import { PasswordForm, Submit } from './ui';

type SetPasswordFormProps = {
    onSubmit: (password: string) => void;
    disabled: boolean;
};

const SetPasswordForm: FC<SetPasswordFormProps> = ({ onSubmit, disabled }) => {
    const { t } = useTranslation();
    const [password, setPassword] = useState(null);

    const handlePasswordChange = useCallback((value) => {
        setPassword(value);
    }, []);

    return (
        <>
            <PasswordForm>
                <SetPassword id='new_password' onChange={handlePasswordChange} />
            </PasswordForm>
            <Submit>
                {/* @ts-ignore: prop error */}
                <FormButton type='submit' disabled={disabled || password === null}>
                    {t('button.next')}
                </FormButton>
            </Submit>
            {/* <WithoutPassword hide={password !== null}>
                {t('setupPasswordProtection.withoutPassword')}
            </WithoutPassword> */}
        </>
    );
};

export default SetPasswordForm;
