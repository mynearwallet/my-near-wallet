import React, { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { currentTargetChecked } from '../../../../../shared/lib/forms/selectors';
import Checkbox from '../../../../common/Checkbox';
import FormButton from '../../../../common/FormButton';
import SafeTranslate from '../../../../SafeTranslate';
import { StyledRemoveAccountForm, StyledTitle, StyledDescription } from './ui';

type RemoveAccountModalProps = {
    accountId: string;
};

type RemoveAccountModalActions = {
    onRemoveAccount: VoidFunction;
    onClose: VoidFunction;
};

const RemoveAccountForm: FC<RemoveAccountModalProps & RemoveAccountModalActions> = ({
    accountId,
    onRemoveAccount,
    onClose,
}) => {
    const { t } = useTranslation();

    const [removeAccountDisclaimerApproved, setRemoveAccountDisclaimerApproved] =
        useState(false);

    return (
        <StyledRemoveAccountForm>
            <StyledTitle>{t('removeAccount.title')}</StyledTitle>
            <StyledDescription>{t('removeAccount.desc')}</StyledDescription>
            <label>
                <Checkbox
                    checked={removeAccountDisclaimerApproved}
                    onChange={currentTargetChecked(setRemoveAccountDisclaimerApproved)}
                />
                <span>
                    {/* @ts-ignore */}
                    <SafeTranslate id="removeAccount.disclaimer" data={{ accountId }} />
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
        </StyledRemoveAccountForm>
    );
};

export default RemoveAccountForm;
