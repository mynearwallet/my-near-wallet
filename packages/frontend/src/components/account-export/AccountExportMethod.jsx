import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

import meteorLoader from '../../images/wallet-migration/meteor-loader.gif';
import { hasPendingMeteorNewKeyStart } from '../../services/meteorConnect';
import Container from '../common/styled/Container.css';
import exportManualIcon from '../svg/Vector.svg';
import {
    trackMigrationMethodExited,
    trackMigrationMethodSelected,
} from './accountExportAnalytics';
import { NearDotComMethod } from './NearDotComMethod';

const ExportMethodPage = styled(Container)`
    &.method-page {
        width: 100%;
        max-width: 1140px;
        box-sizing: border-box;
        padding-inline: 24px;
    }

    &&& {
        h1,
        h2 {
            text-align: center !important;
        }
    }
`;

const MethodList = styled.div`
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-top: 56px;

    @media (max-width: 1064px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 600px) {
        grid-template-columns: 1fr;
    }
`;

const MeteorCardFrame = styled.div`
    position: relative;
    display: flex;
    min-width: 0;
    margin-block: -12px;
    border-radius: 24px;
    box-shadow: 0 8px 20px rgb(30 24 66 / 25%);
    transition: transform 150ms;

    &:hover {
        transform: translateY(-2px);
    }

    @media (prefers-reduced-motion: reduce) {
        transition: none;
    }

    @media (max-width: 600px) {
        margin-block: 0;
    }

    .meteor-recommended {
        background: #fffa38;
        border-radius: 999px;
        box-shadow: 0 3px 8px rgb(30 24 66 / 18%);
        font-size: 12px;
        line-height: 18px;
        position: absolute;
        z-index: 1;
        top: 0;
        left: 50%;
        transform: translate(-50%, -50%);
        margin-top: 0;
        padding: 6px 16px;
        color: #111;
        text-transform: uppercase;
        font-weight: 700;
        white-space: nowrap;
    }
`;

const shootingStar = keyframes`
    0% {
        opacity: 0;
        transform: rotate(135deg) translateX(0);
    }
    4% {
        opacity: 0.65;
    }
    20% {
        opacity: 0;
        transform: rotate(135deg) translateX(240px);
    }
    100% {
        opacity: 0;
        transform: rotate(135deg) translateX(240px);
    }
`;

// Stable scattered positions keep the backdrop from jumping on re-renders.
const backgroundStars = Array.from({ length: 18 }, (_, index) => ({
    left: `${((index * 37 + 11) % 96) + 2}%`,
    top: `${((index * 53 + 7) % 94) + 3}%`,
    size: `${index % 3 === 0 ? 3 : 2}px`,
    duration: `${4 + (index % 5) * 0.7}s`,
    delay: `${-index * 1.3}s`,
}));

const starTwinkle = keyframes`
    0%, 100% { opacity: 0.08; transform: scale(0.65); }
    50% { opacity: 0.6; transform: scale(1); }
`;

const lightSweep = keyframes`
    0%, 15% { opacity: 0; transform: translateX(-100%) skewX(-20deg); }
    30% { opacity: 0.65; }
    60%, 100% { opacity: 0; transform: translateX(350%) skewX(-20deg); }
`;

const MethodButton = styled.button`
    align-items: center;
    border: 0;
    border-radius: 16px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 280px;
    padding: 32px;
    text-align: center;
    transition: transform 150ms, box-shadow 150ms;

    &:hover:not(:disabled) {
        box-shadow: 0 8px 20px rgb(36 39 42 / 20%);
        transform: translateY(-2px);
    }

    &:disabled {
        cursor: wait;
        opacity: 0.75;
    }

    .method-icon-slot {
        align-items: center;
        display: flex;
        height: 65px;
        justify-content: center;
        margin-bottom: 24px;
        width: 68px;
    }

    .method-icon {
        display: block;
        flex: none;
        object-fit: contain;
        overflow: visible;
    }

    .meteor-connect-icon {
        /* The GIF includes whitespace around the logo inside its 300px canvas. */
        height: 130px;
        width: 130px;
        max-width: none;
    }

    .manual-export-icon {
        height: 65px;
        width: 68px;
    }

    .method-title {
        font-size: 20px;
        font-weight: 700;
        line-height: 26px;
    }

    .method-description {
        font-size: 14px;
        line-height: 21px;
        margin-top: 8px;
    }

    .method-tag {
        background: #fff;
        border-radius: 999px;
        color: #5380f5;
        font-size: 12px;
        font-weight: 600;
        line-height: 18px;
        margin-top: 16px;
        padding: 4px 12px;
    }

    .method-status {
        font-size: 14px;
        line-height: 21px;
        margin-top: 20px;
        opacity: 0.85;
    }

    &.meteor-connect {
        &:hover:not(:disabled) {
            transform: none;
        }

        position: relative;
        isolation: isolate;
        flex: 1;
        min-width: 0;
        border: 2px solid #fff;
        border-radius: 24px;
        padding: 40px 24px 28px;
        background: radial-gradient(ellipse at 100% 0%, #a18aff 0%, transparent 55%),
            radial-gradient(ellipse at 0% 100%, #8058ff 0%, transparent 60%),
            linear-gradient(145deg, #471be8 0%, #4013ed 100%);
        color: #fff;

        .meteor-stars {
            position: absolute;
            inset: 0;
            z-index: -1;
            overflow: hidden;
            border-radius: inherit;
            pointer-events: none;
        }

        .meteor-twinkle {
            position: absolute;
            left: var(--star-left);
            top: var(--star-top);
            width: var(--star-size);
            height: var(--star-size);
            border-radius: 50%;
            background: #fff;
            box-shadow: 0 0 5px rgb(255 255 255 / 50%);
            animation: ${starTwinkle} var(--star-duration) ease-in-out var(--star-delay)
                infinite;
        }

        .meteor-shine {
            position: absolute;
            top: -30%;
            left: 0;
            width: 45%;
            height: 160%;
            background: linear-gradient(
                90deg,
                transparent,
                rgb(255 255 255 / 14%),
                transparent
            );
            opacity: 0;
            animation: ${lightSweep} 12s ease-in-out infinite;
        }

        .meteor-star {
            position: absolute;
            top: 12px;
            left: 70%;
            width: 72px;
            height: 2px;
            border-radius: 999px;
            background: linear-gradient(90deg, transparent, rgb(255 255 255 / 85%));
            box-shadow: 0 0 6px rgb(222 213 255 / 50%);
            opacity: 0;
            animation: ${shootingStar} 7s linear infinite;

            &::after {
                content: '';
                position: absolute;
                right: -1px;
                top: -1px;
                width: 4px;
                height: 4px;
                border-radius: 50%;
                background: #fff;
                box-shadow: 0 0 8px #fff;
            }

            &:nth-child(2) {
                top: 48px;
                left: 100%;
                width: 48px;
                animation-delay: 2.3s;
            }

            &:nth-child(3) {
                top: -12px;
                left: 38%;
                width: 56px;
                animation-delay: 4.6s;
            }
        }

        .method-tag {
            margin-top: 24px;
            padding: 4px 18px;
            color: #471be8;
            font-weight: 700;
        }

        &:focus-visible {
            outline: 3px solid #471be8;
            outline-offset: 5px;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        transition: none;

        .meteor-star,
        .meteor-twinkle,
        .meteor-shine {
            animation: none;
            display: none;
        }
    }

    &.manual-export {
        background: #f0f4ff;
        color: #5380f5;

        .method-icon {
            color: #5380f5;
        }
    }
`;

// const Advanced = styled.div`
//     margin-top: 40px;
//     text-align: center;

//     .advanced-description {
//         color: #72727a;
//         font-size: 13px;
//         line-height: 20px;
//         margin: 16px auto 0;
//         max-width: 520px;
//     }

//     .advanced-action {
//         margin-top: 12px;
//     }
// `;

export default function AccountExportMethod() {
    const { t } = useTranslation();
    const history = useHistory();
    const location = useLocation();
    const accountIds = location.state?.accountIds;
    const didSelectMethod = useRef(false);

    useEffect(() => {
        if (!Array.isArray(accountIds) || accountIds.length === 0) {
            history.replace('/export-accounts/select');
        }
    }, [accountIds, history]);

    useEffect(
        () => () => {
            if (
                !didSelectMethod.current &&
                Array.isArray(accountIds) &&
                accountIds.length > 0
            ) {
                trackMigrationMethodExited(accountIds);
            }
        },
        [accountIds]
    );

    /**
     * Stabilization SD7: a start interrupted by bridge/session expiry left its durable id
     * stashed, and calling start again REPLAYS it — Meteor resumes exactly where the user was
     * (typically mid-way through confirming the recovery phrase) instead of minting a second set
     * of destination keys. The button below says "Continue" when that is what a click will do.
     */
    const hasInterruptedStart = hasPendingMeteorNewKeyStart();

    const handleNewKeyTransfer = () => {
        didSelectMethod.current = true;
        trackMigrationMethodSelected('new_key', accountIds);
        history.push('/export-accounts/new-key-start', { accountIds });
    };

    // const handleExistingSecretTransfer = async () => {
    //     let didNavigateToSuccess = false;

    //     setIsExporting(true);
    //     setErrorMessage('');
    //     setErrorCode('');
    //     setIsFencedError(false);

    //     try {
    //         const accounts = await loadExportAccountSecrets(accountIds);
    //         const outcome = await promptMeteorAccountTransfer({
    //             accounts,
    //             networkId: meteorNetworkId,
    //         });

    //         if (outcome.status === 'imported') {
    //             didNavigateToSuccess = true;
    //             saveAccountExportSuccess(accountIds);
    //             history.push('/export-accounts/success', { accountIds });
    //         } else if (outcome.status === 'declined') {
    //             setErrorMessage(t('newKeyTransfer.existingSecret.declined'));
    //         } else if (outcome.status === 'expired') {
    //             setErrorMessage(t('newKeyTransfer.existingSecret.expired'));
    //         }
    //     } catch (error) {
    //         // Translated copy first, the SDK id as fine print — never the raw id as the sentence.
    //         const { i18nKey, code } = describeNewKeyTransferError(error);
    //         setErrorMessage(
    //             i18nKey ? t(i18nKey) : t('newKeyTransfer.existingSecret.startFailed')
    //         );
    //         setErrorCode(code);
    //     } finally {
    //         if (!didNavigateToSuccess) {
    //             setIsExporting(false);
    //         }
    //     }
    // };

    if (!Array.isArray(accountIds) || accountIds.length === 0) {
        return null;
    }

    return (
        <ExportMethodPage className='method-page'>
            <div className='send-theme'>
                <h1>{t('newKeyTransfer.methodHeading')}</h1>
                <h2>{t('newKeyTransfer.methodSubheading')}</h2>
                <MethodList>
                    <MeteorCardFrame>
                        <span className='meteor-recommended'>
                            {t('newKeyTransfer.recommended')}
                        </span>
                        <MethodButton
                            className='meteor-connect'
                            onClick={handleNewKeyTransfer}
                        >
                            <span className='meteor-stars' aria-hidden='true'>
                                <span className='meteor-star' />
                                <span className='meteor-star' />
                                <span className='meteor-star' />
                                {backgroundStars.map((star, index) => (
                                    <span
                                        key={index}
                                        className='meteor-twinkle'
                                        style={{
                                            '--star-left': star.left,
                                            '--star-top': star.top,
                                            '--star-size': star.size,
                                            '--star-duration': star.duration,
                                            '--star-delay': star.delay,
                                        }}
                                    />
                                ))}
                                <span className='meteor-shine' />
                            </span>
                            <span className='method-icon-slot'>
                                <img
                                    alt=''
                                    className='method-icon meteor-connect-icon'
                                    src={meteorLoader}
                                />
                            </span>
                            <span className='method-title'>
                                {t(
                                    hasInterruptedStart
                                        ? 'newKeyTransfer.continueTitle'
                                        : 'newKeyTransfer.title'
                                )}
                            </span>
                            <span className='method-description'>
                                {t(
                                    hasInterruptedStart
                                        ? 'newKeyTransfer.continueDescription'
                                        : 'newKeyTransfer.description'
                                )}
                            </span>
                            <span className='method-tag'>
                                {t('newKeyTransfer.easiest')}
                            </span>
                        </MethodButton>
                    </MeteorCardFrame>

                    <NearDotComMethod
                        onSelect={() => {
                            didSelectMethod.current = true;
                            trackMigrationMethodSelected('near_com', accountIds);
                            window.open(
                                '/export-accounts/neardotcom/guide',
                                '_blank',
                                'noopener,noreferrer'
                            );
                        }}
                    />

                    <MethodButton
                        className='manual-export'
                        onClick={() => {
                            didSelectMethod.current = true;
                            trackMigrationMethodSelected('manual', accountIds);
                            history.push('/export-accounts/manual', { accountIds });
                        }}
                    >
                        <span className='method-icon-slot'>
                            <img
                                alt=''
                                className='method-icon manual-export-icon'
                                src={exportManualIcon}
                            />
                        </span>
                        <span className='method-title'>
                            {t('newKeyTransfer.manualTitle')}
                        </span>
                        <span className='method-description'>
                            {t('newKeyTransfer.manualDescription')}
                        </span>
                    </MethodButton>
                </MethodList>

                {/* <Advanced>
                    <FormButton
                        className='link'
                        color='gray'
                        disabled={isExporting}
                        onClick={() => setShowAdvanced((current) => !current)}
                    >
                        {t(
                            showAdvanced
                                ? 'newKeyTransfer.hideAdvanced'
                                : 'newKeyTransfer.showAdvanced'
                        )}
                    </FormButton>
                    {showAdvanced && (
                        <>
                            <p className='advanced-description'>
                                {t('newKeyTransfer.advancedDescription')}
                            </p>
                            <div className='advanced-action'>
                                <FormButton
                                    color='gray'
                                    disabled={isExporting}
                                    onClick={() => void handleExistingSecretTransfer()}
                                >
                                    {t('newKeyTransfer.continueExistingSecret')}
                                </FormButton>
                            </div>
                        </>
                    )}
                </Advanced> */}
            </div>
        </ExportMethodPage>
    );
}
