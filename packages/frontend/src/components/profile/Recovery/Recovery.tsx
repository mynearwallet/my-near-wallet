import React, { FC, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { Mixpanel } from '../../../mixpanel';
import { deleteRecoveryMethod, redirectTo } from '../../../redux/actions/account';
import { selectAccountLedgerKey } from '../../../redux/slices/account';
import {
    actions as recoveryMethodsActions,
    selectRecoveryMethodsStatus
} from '../../../redux/slices/recoveryMethods';
import Modal from '../../common/modal/Modal';
import Tooltip from '../../common/Tooltip';
import ShieldIcon from '../../svg/ShieldIcon';
import ConfirmDisableMethod from '../ConfirmDisableMethod';
import HardwareDevices from '../HardwareDevices';
import { RecoveryOption } from '../ui';
import { formatCreatedAt } from './lib/format';
import { createUserRecoveryMethodsMap } from './lib/recovery-methods';
import PasswordProtection from './PasswordProtection';
import RecoveryMethod from './RecoveryMethod';

const { fetchRecoveryMethods } = recoveryMethodsActions;

enum RECOVERY_METHOD {
    LEDGER ='ledger',
    PHRASE ='phrase',
};

type RecoveryProps = {
    account: {
        accountId: string,
        ledgerKey: string,
    };
    userRecoveryMethods: string[];
    hasTwoFactor: boolean;
    onWalletEncrypt: (password: string) => void;
}

const Recovery: FC<RecoveryProps> = ({
    account,
    userRecoveryMethods,
    hasTwoFactor,
    onWalletEncrypt,
}) => {
    const { t } = useTranslation();

    const [recoveryMethodsMap, setMethodsMap] = useState(
        createUserRecoveryMethodsMap(userRecoveryMethods)
    );

    const [showPhraseDisabling, setPhraseDisabling] = useState(false);
    const [isPhraseProcessing, setPhraseProcessing] = useState(false);
    const [showDisabledModal, setShowDisabledModal] = useState(false);

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
        /*@ts-ignore*/
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

        /*@ts-ignore*/
        dispatch(fetchRecoveryMethods({
            accountId: account.accountId
        }));
        setPhraseProcessing(false);
    }, [account, phraseMethod]);

    const handleModalClose = useCallback(() => {
        setShowDisabledModal(false);
    }, []);

    return (
        <>
            <h2>
                <ShieldIcon />
                {t('profile.security.title')}
            </h2>
            <h4>
                {t('profile.security.mostSecure')}
                {(
                    /*@ts-ignore*/
                    <Tooltip translate='profile.security.mostSecureDesc' icon='icon-lg' />
                )}
            </h4>

            {!hasTwoFactor && (
                <HardwareDevices
                    recoveryMethods={userRecoveryMethods}
                    hasLedger={hasLedger}
                    ledgerIsConnected={ledgerIsConnected}
                    hasLedgerButNotConnected={hasLedgerButNotConnected}
                />
            )}
            <RecoveryOption>
                <PasswordProtection
                    onWalletEncrypt={onWalletEncrypt} />
            </RecoveryOption>
            <h4>
                {t('profile.security.lessSecure')}
                {(
                /*@ts-ignore*/
                    <Tooltip
                        translate='profile.security.lessSecureDesc'
                        icon='icon-lg' />
                )}
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
                /*@ts-ignore*/
                <Modal
                    isOpen={showDisabledModal}
                    onClose={handleModalClose}>
                    {t('recoveryMgmt.disableNotAllowed')}
                </Modal>
            )}
        </>
    );
};

export default Recovery;
