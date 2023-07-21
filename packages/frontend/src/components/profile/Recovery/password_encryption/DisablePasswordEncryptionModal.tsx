import { t } from 'i18next';
import React, { FC, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectPasswordProtectionSlice } from '../../../../redux/slices/passwordProtectedWallet/passwordProtectedWallet';
import { currentTargetValue } from '../../../../shared/lib/forms/selectors';
import { storedWalletDataActions } from '../../../../utils/encryptedWalletData';
import { wallet } from '../../../../utils/wallet';
import { inLength } from '../../../accounts/password_encryption/SetPassword/lib/validation';
import { Enter } from '../../../accounts/password_encryption/SetPassword/ui';
import Input from '../../../accounts/password_encryption/SetPassword/ui/Input';
import { Submit } from '../../../accounts/password_encryption/SetPasswordForm/ui';
import FormButton from '../../../common/FormButton';
import Modal from '../../../common/modal/Modal';
import { Description } from '../RecoveryMethod/ui';

type DisablePasswordEncryptionModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export const DisablePasswordEncryptionModal: FC<DisablePasswordEncryptionModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const { dataStatus } = useSelector(selectPasswordProtectionSlice);

    const handleChangePassword = useCallback(
        (value: string) => {
            setPassword(value);
        },
        [setPassword]
    );

    const confirmDisablePasswordEncryption = async () => {
        if (await storedWalletDataActions.isPasswordGood(password)) {
            setError(null);
            await wallet.disablePasswordEncryption(password);
        } else {
            setError(t('setupPasswordProtection.invalidPassword'));
        }
    };

    return (
        // @ts-ignore
        <Modal isOpen={isOpen} onClose={onClose} modalSize={'lg'}>
            {dataStatus.hasEncryptedData ? (
                <>
                    <h1>{t('setupPasswordProtection.disableModal.title')}</h1>
                    <p>{t('setupPasswordProtection.disableModal.description')}</p>
                    <Description>
                        {t('setupPasswordProtection.disableModal.instruction')}
                    </Description>
                    <br />
                    <Enter>
                        <Input
                            placeholder={t('setupPasswordProtection.enter')}
                            value={password}
                            error={error}
                            onChange={currentTargetValue(handleChangePassword)}
                        />
                    </Enter>

                    <Submit>
                        {/* @ts-ignore: prop error */}
                        <FormButton
                            {...{
                                onClick: confirmDisablePasswordEncryption,
                                disabled: !inLength(password),
                            }}
                        >
                            {t('button.confirm')}
                        </FormButton>
                    </Submit>
                </>
            ) : (
                <>
                    <h1>{t('setupPasswordProtection.disableModal.disabledTitle')}</h1>
                    <p>{t('setupPasswordProtection.disableModal.disabledDescription')}</p>

                    <Submit>
                        {/* @ts-ignore: prop error */}
                        <FormButton onClick={onClose} disabled={!inLength(password)}>
                            {t('button.confirm')}
                        </FormButton>
                    </Submit>
                </>
            )}
        </Modal>
    );
};
