import React, { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Title, Description } from '../';
import Checkbox from '../../../../common/Checkbox';
import FormButton from '../../../../common/FormButton';
import Modal from '../../../../common/modal/Modal';
import SafeTranslate from '../../../../SafeTranslate';
import { StyledRemoveAccountModal } from './ui';

type RemoveAccountModalProps = {
    accountId: string;
    isOpen: boolean;
};

type RemoveAccountModalActions = {
    onRemoveAccount: VoidFunction;
    onClose: VoidFunction;
};

const RemoveAccountModal: FC<RemoveAccountModalProps & RemoveAccountModalActions> = ({
    accountId,
    isOpen,
    onRemoveAccount,
    onClose,
}) => {
    const { t } = useTranslation();

    const [removeAccountDisclaimerApproved, setRemoveAccountDisclaimerApproved] =
        useState(false);

    return (
        <Modal id="remove-account-modal" isOpen={isOpen} onClose={onClose} modalSize="sm">
            <StyledRemoveAccountModal>
                <Title>{t('removeAccount.title')}</Title>
                <Description>{t('removeAccount.desc')}</Description>
                <label>
                    <Checkbox
                        checked={removeAccountDisclaimerApproved}
                        onChange={(e) =>
                            setRemoveAccountDisclaimerApproved(e.target.checked)
                        }
                    />
                    <span>
                        <SafeTranslate
                            id="removeAccount.disclaimer"
                            data={{ accountId }}
                        />
                    </span>
                </label>
                <FormButton
                    // @ts-ignore
                    disabled={!removeAccountDisclaimerApproved}
                    onClick={onRemoveAccount}
                >
                    {t('button.removeAccount')}
                </FormButton>
                {/* @ts-ignore */}
                <FormButton className="link" onClick={onClose}>
                    {t('button.cancel')}
                </FormButton>
            </StyledRemoveAccountModal>
        </Modal>
    );
};

export default RemoveAccountModal;
