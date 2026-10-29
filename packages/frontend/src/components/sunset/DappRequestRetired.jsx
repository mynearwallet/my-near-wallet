import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import {
    isSunsetCapabilityEnabled,
    METEOR_WALLET_SITE_URL,
    SUNSET_LEARN_MORE_URL,
} from '../../config/sunset';
import { selectPendingExternalRedirectUrl } from '../../redux/slices/externalRedirect';
import AccountExportNotice from '../account-export/AccountExportNotice';
import useMigrationEntry from '../account-export/useMigrationEntry';
import FormButton from '../common/FormButton';
import Container from '../common/styled/Container.css';
import {
    isPopupRequest,
    isUsableCallbackUrl,
    readDappRequest,
    sendLoginFailure,
    sendSignFailure,
    sendSignMessageFailure,
    sendVerifyOwnerFailure,
} from './dappFailure';
import { hasActiveAccount } from './FeatureRetiredPage';
import {
    safeHost,
    trackSunsetDappRequestRejected,
    trackSunsetFeatureBlocked,
    trackSunsetRetiredCtaClicked,
} from './sunsetAnalytics';
import SunsetIcon from './SunsetIcon';

const SunsetDappPage = styled(Container)`
    &&& {
        text-align: center;

        h1 {
            margin-top: 20px;
            outline: none;
        }

        h1,
        h2 {
            text-align: center !important;
        }

        h2 strong {
            color: #24272a;
        }
    }

    code {
        background: #f0f0f1;
        border-radius: 4px;
        color: #24272a;
        padding: 1px 6px;
    }
`;

const Buttons = styled.div`
    margin-top: 40px;

    > button {
        width: 100%;
    }

    .secondary {
        margin-top: 8px;

        > button {
            width: 100%;
        }
    }

    .returning {
        color: #72727a;
        font-size: 14px;
        margin: 16px 0 0;
    }

    .learn-more {
        display: inline-block;
        font-size: 14px;
        margin-top: 16px;
    }
`;

const CAPABILITY_BY_KIND = {
    login: 'dappConnect',
    sign: 'dappSign',
    signMessage: 'dappSignMessage',
    verifyOwner: 'dappSignMessage',
};

/**
 * What a dApp request MyNearWallet no longer serves shows instead. The user always gets a way to
 * send the app a proper failure, so neither popup nor redirect integrations are left hanging.
 * It never redirects on its own: the user needs to read why first.
 *
 * It also answers requests that are still served, but reach a browser with no account signed in:
 * guests are no longer offered an import, so they could not get to the approval screen.
 */
export default function DappRequestRetired({ kind }) {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const history = useHistory();
    const location = useLocation();
    const heading = useRef(null);
    const migration = useMigrationEntry();
    const [isReturning, setIsReturning] = useState(false);
    const pendingRedirect = useSelector(selectPendingExternalRedirectUrl);
    const hadPendingRedirect = useRef(false);

    const request = readDappRequest(kind, location.search);
    const host = safeHost(request.hostUrl);
    const canReturn = isUsableCallbackUrl(request.callbackUrl);
    const isSignedIn = hasActiveAccount();
    const isSignedOutRequest =
        kind !== 'login' &&
        !isSignedIn &&
        isSunsetCapabilityEnabled(CAPABILITY_BY_KIND[kind]);
    const copy =
        kind === 'login'
            ? 'sunset.dapp.login'
            : isSignedOutRequest
            ? 'sunset.dapp.signedOut'
            : 'sunset.dapp.approval';

    useEffect(() => {
        heading.current?.focus({ preventScroll: true });
        trackSunsetFeatureBlocked({
            capability: CAPABILITY_BY_KIND[kind],
            entry: isSignedOutRequest ? 'signed_out' : 'route',
            route: location.pathname,
        });
    }, [kind]);

    // Cancelling "You're leaving MyNearWallet" clears the pending redirect without leaving, so
    // let the user try again instead of leaving the button stuck on "Returning…".
    useEffect(() => {
        if (pendingRedirect) {
            hadPendingRedirect.current = true;
        } else if (hadPendingRedirect.current) {
            hadPendingRedirect.current = false;
            setIsReturning(false);
        }
    }, [pendingRedirect]);

    const returnToApp = () => {
        const failure = {
            dispatch,
            callbackUrl: request.callbackUrl,
            errorMessage: t('sunset.dapp.errorMessage'),
        };
        const sent =
            kind === 'login'
                ? sendLoginFailure({ ...failure, failureUrl: request.callbackUrl })
                : kind === 'sign'
                ? sendSignFailure({ ...failure, signMeta: request.meta })
                : kind === 'signMessage'
                ? sendSignMessageFailure(failure)
                : sendVerifyOwnerFailure({ ...failure, meta: request.meta });
        if (sent) {
            setIsReturning(true);
            trackSunsetDappRequestRejected({
                kind,
                mode: isPopupRequest() ? 'popup' : 'redirect',
                callbackUrl: request.callbackUrl,
            });
        }
    };

    const openMigration = () => {
        trackSunsetRetiredCtaClicked({
            capability: CAPABILITY_BY_KIND[kind],
            cta: 'migrate',
        });
        if (isPopupRequest()) {
            // Keep the popup, and with it the app's channel, open.
            window.open(migration.href, '_blank', 'noopener,noreferrer');
            return;
        }
        history.push(migration.to);
    };

    const openMeteor = () => {
        trackSunsetRetiredCtaClicked({
            capability: CAPABILITY_BY_KIND[kind],
            cta: 'get_meteor',
        });
        window.open(METEOR_WALLET_SITE_URL, '_blank', 'noopener,noreferrer');
    };

    const body = request.isCli
        ? t('sunset.dapp.cli.body')
        : host
        ? t(`${copy}.bodyWithHost`, { host })
        : t(`${copy}.body`);

    return (
        <SunsetDappPage className='small-centered border'>
            <SunsetIcon size={48} centered />
            <h1 ref={heading} tabIndex={-1}>
                {t(request.isCli ? 'sunset.dapp.cli.title' : `${copy}.title`)}
            </h1>
            <h2>{body}</h2>
            <AccountExportNotice variant='info'>
                <p>
                    {request.isCli
                        ? t('sunset.dapp.cli.hint')
                        : isSignedOutRequest
                        ? host
                            ? t('sunset.dapp.signedOut.hintWithHost', { host })
                            : t('sunset.dapp.signedOut.hint')
                        : host
                        ? t('sunset.dapp.hintWithHost', { host })
                        : t('sunset.dapp.hint')}
                </p>
            </AccountExportNotice>
            <Buttons>
                {canReturn && (
                    <FormButton
                        disabled={isReturning}
                        onClick={() => {
                            trackSunsetRetiredCtaClicked({
                                capability: CAPABILITY_BY_KIND[kind],
                                cta: 'return_to_app',
                            });
                            returnToApp();
                        }}
                    >
                        {host
                            ? t('sunset.dapp.returnToHost', { host })
                            : t('sunset.dapp.returnToApp')}
                    </FormButton>
                )}
                {isSignedIn && (
                    <div className={canReturn ? 'secondary' : undefined}>
                        <FormButton
                            className={canReturn ? 'link' : undefined}
                            color={canReturn ? 'gray' : 'blue'}
                            onClick={openMigration}
                        >
                            {t(
                                request.isCli
                                    ? 'sunset.common.exportKeys'
                                    : migration.isResume
                                    ? 'sunset.common.resume'
                                    : 'sunset.common.migrate'
                            )}
                        </FormButton>
                    </div>
                )}
                {!isSignedIn && !request.isCli && (
                    <div className={canReturn ? 'secondary' : undefined}>
                        <FormButton
                            className={canReturn ? 'link' : undefined}
                            color={canReturn ? 'gray' : 'blue'}
                            onClick={openMeteor}
                        >
                            {t('sunset.common.getMeteor')}
                        </FormButton>
                    </div>
                )}
                {isReturning && (
                    <p className='returning' role='status'>
                        {host
                            ? t('sunset.dapp.returningToHost', { host })
                            : t('sunset.dapp.returningToApp')}
                    </p>
                )}
                {!canReturn && !request.isCli && (
                    <p className='returning'>{t('sunset.dapp.closeWindow')}</p>
                )}
                <a
                    className='learn-more'
                    href={SUNSET_LEARN_MORE_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                >
                    {t('sunset.common.whyIsThisHappening')}
                </a>
            </Buttons>
        </SunsetDappPage>
    );
}
