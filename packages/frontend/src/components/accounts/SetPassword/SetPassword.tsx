import React, { FC, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { currentTargetValue } from '../../../shared/lib/forms/selectors';
import PasswordInput from '../../common/PasswordInput';
import ComplexityBlock from '../ComplexityBlock';
import { validatePassword } from '../ComplexityBlock/lib/complexity';
import { inLength, isEqual, MIN_PASS_LEN } from './lib/validation';
import { Confirm, Enter, Warning } from './ui';

type SetPasswordProps = {
    disabled: boolean;
    onChange: (value: string|null) => void;
}

const SetPassword: FC<SetPasswordProps> = ({ disabled, onChange }) => {
    const { t } = useTranslation();
    const [password, setPassword] = useState('');
    const [confirmPassValue, setConfirmPassValue] = useState('');
    const [lengthError, setLengthError] = useState(false);
    const [confirmError, setConfirmError] = useState(false);
    const [isPassFocused, setPassFocused] = useState(false);

    const handleCommonChange = useCallback((pass: string, confirm: string) => {
        if (!inLength(pass)) {
            setLengthError(true);

            onChange(null);
            return;
        }
        setLengthError(false);

        if (!isEqual(pass, confirm)) {
            if (confirm.length) {
                setConfirmError(true);
            }

            onChange(null);
            return;
        }

        setConfirmError(false);
        onChange(pass);
    }, []);


    const handleChangePassword = useCallback((value: string) => {
        setPassword(value);
        handleCommonChange(value, confirmPassValue);
    }, [confirmPassValue]);

    const handlePasswordFocus = useCallback(() => {
        setPassFocused(true);
    }, []);

    const handlePasswordBlur = useCallback(() => {
        setPassFocused(false);
        handleCommonChange(password, confirmPassValue);
    }, [password, confirmPassValue]);

    const handleChangeConfirmPassword = useCallback((value: string) => {
        setConfirmPassValue(value);
        handleCommonChange(password, value);
    }, [password]);

    const handleConfirmBlur = useCallback(() => {
        handleCommonChange(password, confirmPassValue);
    }, [password, confirmPassValue]);

    const shouldShowConfirmError = confirmError && !isPassFocused;

    return (
        <>
            <Enter>
                <PasswordInput
                    disabled={disabled}
                    error={lengthError ? t('setupPasswordProtection.lengthError'): ''}
                    placeholder={t('setupPasswordProtection.enter')}
                    value={password}
                    onChange={currentTargetValue(handleChangePassword)}
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
                />
            </Enter>

            <Confirm>
                <PasswordInput
                    disabled={disabled}
                    error={shouldShowConfirmError ? t('setupPasswordProtection.matchError'): ''}
                    placeholder={t('setupPasswordProtection.confirm')}
                    value={confirmPassValue}
                    onChange={currentTargetValue(handleChangeConfirmPassword)}
                    onBlur={handleConfirmBlur}
                />
            </Confirm>
            <ComplexityBlock
                complexity={validatePassword(password, MIN_PASS_LEN)} />
            <Warning>{t('setupPasswordProtection.alert')}</Warning>
        </>
    );
};

export default SetPassword;
