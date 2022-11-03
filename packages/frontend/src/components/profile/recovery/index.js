import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { Mixpanel } from '../../../mixpanel';
import { deleteRecoveryMethod, redirectTo } from '../../../redux/actions/account';
import { selectAccountLedgerKey } from '../../../redux/slices/account';
import {
    actions as recoveryMethodsActions,
    selectRecoveryMethodsStatus
} from '../../../redux/slices/recoveryMethods';
import { isEncrypted } from '../../../utils/encryption/keys';
import EnterPassword from '../../accounts/EnterPasswordForm/EnterPassword';
import Modal from '../../common/modal/Modal';
import Container from '../../common/styled/Container.css';
import Tooltip from '../../common/Tooltip';
import ShieldIcon from '../../svg/ShieldIcon';
import ConfirmDisableMethod from '../ConfirmDisableMethod';
import HardwareDevices from '../HardwareDevices';
import { RecoveryOption } from '../ui';
import { formatCreatedAt } from './lib/format';
import { createUserRecoveryMethodsMap } from './lib/recovery-methods';
import RecoveryMethod from './RecoveryMethod';

const { fetchRecoveryMethods } = recoveryMethodsActions;

const RECOVERY_METHOD = {
    LEDGER: 'ledger',
    PHRASE: 'phrase',
};

export const Recovery = ({
    account,
    userRecoveryMethods,
    twoFactor
}) => {
    const { t } = useTranslation();

    const [recoveryMethodsMap, setMethodsMap] = useState(
        createUserRecoveryMethodsMap(userRecoveryMethods)
    );

    const [showPhraseDisabling, setPhraseDisabling] = useState(false);
    const [isPhraseProcessing, setPhraseProcessing] = useState(false);
    const [showDisabledModal, setShowDisabledModal] = useState(false);
    const [showDisablePasswordModal, setShowDisablePasswordModal] = useState(false);

    useEffect(() => {
        /** Cache list for easy access */
        setMethodsMap(createUserRecoveryMethodsMap(userRecoveryMethods));
    }, [userRecoveryMethods]);

    const dispatch = useDispatch();

    const hasLedger = Boolean(recoveryMethodsMap[RECOVERY_METHOD.LEDGER]);
    const ledgerIsConnected = useSelector(selectAccountLedgerKey);
    const hasLedgerButNotConnected = hasLedger && !ledgerIsConnected;

    const phraseMethod = recoveryMethodsMap[RECOVERY_METHOD.PHRASE];

    const loadingStatus = useSelector((state) =>
        selectRecoveryMethodsStatus(state, { accountId: account.accountId }));

    const handleEnableSeedPhrase = useCallback(() => {
        Mixpanel.track('SR-SP Click enable button');
        dispatch(redirectTo(`/set-recovery/${account.accountId}`));
    }, [dispatch, account]);

    const handleDisablePassPhrase = useCallback(async () => {
        const deleteAllowed = Boolean(account.ledgerKey);

        if (!deleteAllowed) {
            setShowDisabledModal(true);

            return;
        }

        setPhraseDisabling(true);
    }, [account]);

    const handlePhraseDelete = useCallback(async () => {
        setPhraseProcessing(true);
        await Mixpanel.withTracking(
            'SR-SP Delete method',
            async () => await dispatch(
                deleteRecoveryMethod(phraseMethod, true)
            )
        );

        dispatch(fetchRecoveryMethods({
            accountId: account.accountId
        }));
        setPhraseProcessing(false);
    }, [account, phraseMethod]);

    const handleModalClose = useCallback(() => {
        setShowDisabledModal(false);
    }, []);

    const handleEnablePassword = useCallback(() => {
        //  TODO https://mnw.atlassian.net/browse/MNW-213
    }, []);

    const togglePasswordConfirmModal = useCallback(() =>
        setShowDisablePasswordModal(!showDisablePasswordModal),
    [showDisablePasswordModal]
    );

    const handleConfirmDeletePassword = useCallback((password) => {
        togglePasswordConfirmModal();
    }, [togglePasswordConfirmModal]);

    return (
        <>
            <h2>
                <ShieldIcon />
                {t('profile.security.title')}
            </h2>
            <h4>
                {t('profile.security.mostSecure')}
                <Tooltip translate='profile.security.mostSecureDesc' icon='icon-lg' />
            </h4>

            {!twoFactor && (
                <HardwareDevices
                    recoveryMethods={userRecoveryMethods}
                    hasLedger={hasLedger}
                    ledgerIsConnected={ledgerIsConnected}
                    hasLedgerButNotConnected={hasLedgerButNotConnected}
                />
            )}
            <RecoveryOption>
                <RecoveryMethod
                    title={t('passwordProtection.title')}
                    description={t('passwordProtection.description')}
                    methodEnabled={isEncrypted()}
                    onEnable={handleEnablePassword}
                    onDisable={togglePasswordConfirmModal}
                />
            </RecoveryOption>
            {showDisablePasswordModal && (
                <Modal
                    isOpen={showDisablePasswordModal}
                    onClose={togglePasswordConfirmModal}>
                    <Container className='small-centered'>
                        <EnterPassword
                            onValidPassword={handleConfirmDeletePassword} />
                    </Container>
                </Modal>
            )}
            <h4>
                {t('profile.security.lessSecure')}
                <Tooltip
                    translate='profile.security.lessSecureDesc'
                    icon='icon-lg' />
            </h4>
            <RecoveryOption>
                <RecoveryMethod
                    title={t('recoveryMgmt.methodTitle.phrase')}
                    description={phraseMethod?.confirmed ?
                        (
                            <>
                                {t('recoveryMgmt.enabled')}&nbsp;
                                {formatCreatedAt(phraseMethod?.createdAt)}
                            </>
                        ) : null
                    }
                    methodEnabled={phraseMethod?.confirmed}
                    skeleton={loadingStatus.isInitialized ? undefined : '80px'}
                    onEnable={handleEnableSeedPhrase}
                    onDisable={handleDisablePassPhrase}
                />
                { showPhraseDisabling && (
                    <ConfirmDisableMethod
                        title={t('recoveryMgmt.disableTitle')}
                        description={t('recoveryMgmt.disableTextPhrase')}
                        isProcessing={isPhraseProcessing}
                        isOpen={showPhraseDisabling}
                        onClose={() => setPhraseDisabling(false)}
                        onSubmit={handlePhraseDelete}
                    />
                )}
            </RecoveryOption>
            {showDisabledModal && (
                <Modal
                    isOpen={showDisabledModal}
                    onClose={handleModalClose}>
                    {t('recoveryMgmt.disableNotAllowed')}
                </Modal>
            )}
        </>
    );
};


// todo
// - сверстать попап с предупреждением который нужно показать при клике на restore
// - написать процедуру которая выпилит все перешифрованные аккаунты при клике на restore

// - доверстать предупреждение при создании пароля (оранжевый текст) о том что все пароли будут перешифрованы
// - сверстать вариант формы установки пароля с create и cancel и показать его при клике на включение пароля из настроек
// - написать процедуру включения пароля из настроек

// - сверстать вариант плашки в настройках, при которой пароль включен и его можно либо поменять, либо выключить
// - написать процедуру которая отключит шифрование на всех аккаунтах
// - сверстать форму с изменением существующего пароля
// - написать процедуру которая поменяет существующий пароль

// - включить шаг с установкой пароля во флоу восстановления по сид фразе

// - написать процедуру которая при попытке удаления аккаунта запросит пароль
