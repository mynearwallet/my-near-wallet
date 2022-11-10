import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { targetValue } from '../../../shared/lib/forms/selectors';
import classNames from '../../../utils/classNames';
import FormButton from '../../common/FormButton';

type RecoverAccountSeedPhraseFormProps = {
    isLegit: boolean;
    seedPhrase: string;
    localAlert?: { success: boolean };
    recoveringAccount: boolean;
    findMyAccountSending: boolean;
    handleChange: (value: string) => void;
}

const RecoverAccountSeedPhraseForm: FC<RecoverAccountSeedPhraseFormProps> = ({
    isLegit,
    handleChange,
    seedPhrase,
    localAlert,
    recoveringAccount,
    findMyAccountSending
}) => {
    const { t } = useTranslation();

    const inputClassName = classNames([
        {
            'success': localAlert && localAlert.success
        },
        {
            'problem': localAlert && localAlert.success === false
        }
    ]);

    return (
        <>
            <h4>{t('recoverSeedPhrase.seedPhraseInput.title')}</h4>
            <input
                value={seedPhrase}
                onChange={targetValue(handleChange)}
                className={inputClassName}
                placeholder={t('recoverSeedPhrase.seedPhraseInput.placeholder')}
                disabled={recoveringAccount}
                data-test-id='seedPhraseRecoveryInput'
                required
                //@ts-ignore
                tabIndex='2'
                autoCapitalize='off'
            />
            <FormButton
                //@ts-ignore
                type='submit'
                color='blue'
                disabled={!isLegit || recoveringAccount}
                sending={findMyAccountSending}
                sendingString='button.recovering'
                data-test-id='seedPhraseRecoverySubmitButton'
            >
                {t('button.findMyAccount')}
            </FormButton>
        </>
    );
};

export default RecoverAccountSeedPhraseForm;
