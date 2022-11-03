import React from 'react';
import { useTranslation } from 'react-i18next';

import classNames from '../../utils/classNames';
import FormButton from '../common/FormButton';

const RecoverAccountSeedPhraseForm = ({
    isLegit,
    handleChange,
    seedPhrase,
    localAlert,
    recoveringAccount,
    findMyAccountSending
}) => {
    const { t } = useTranslation();

    return (
        <>
            <h4>{t('recoverSeedPhrase.seedPhraseInput.title')}</h4>
            <input
                value={seedPhrase}
                onChange={(e) => handleChange(e.target.value)}
                className={classNames([{'success': localAlert && localAlert.success}, {'problem': localAlert && localAlert.success === false}])}
                placeholder={t('recoverSeedPhrase.seedPhraseInput.placeholder')}
                disabled={recoveringAccount}
                data-test-id="seedPhraseRecoveryInput"
                required
                tabIndex='2'
                autoCapitalize='off'
            />
            <FormButton
                type='submit'
                color='blue'
                disabled={!isLegit || recoveringAccount}
                sending={findMyAccountSending}
                sendingString='button.recovering'
                data-test-id="seedPhraseRecoverySubmitButton"
            >
                {t('button.findMyAccount')}
            </FormButton>
        </>
    );
};

export default RecoverAccountSeedPhraseForm;
