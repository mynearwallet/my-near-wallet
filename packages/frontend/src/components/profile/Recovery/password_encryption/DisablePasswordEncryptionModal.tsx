import { t } from 'i18next';
import React, { FC, useCallback, useState } from 'react';

import { currentTargetValue } from '../../../../shared/lib/forms/selectors';
import { getEncryptedData } from '../../../../utils/localStorage';
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
    const [isEncrypted, setIsEncrypted] = useState(
        !!getEncryptedData() && getEncryptedData().isEncryptionEnabled
    );

    const handleChangePassword = useCallback(
        (value: string) => {
            setPassword(value);
        },
        [setPassword]
    );

    const confirmDisablePasswordEncryption = async () => {
        await wallet.disablePasswordEncryption(password);
        setIsEncrypted(false);
    };

    return (
        // @ts-ignore
        <Modal isOpen={isOpen} onClose={onClose} modalSize={'lg'}>
            {isEncrypted ? (
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
                            onChange={currentTargetValue(handleChangePassword)}
                        />
                    </Enter>

                    <Submit>
                        {/* @ts-ignore: prop error */}
                        <FormButton
                            onClick={confirmDisablePasswordEncryption}
                            disabled={!inLength(password)}
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
