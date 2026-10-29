import React from 'react';
import { useTranslation } from 'react-i18next';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import LandingBackground from './LandingBackground';
import { isSunsetCapabilityEnabled } from '../../config/sunset';
import iPhoneMockup from '../../images/iphone-mockup.png';
import { resolveMeteorWalletWebUrl } from '../../services/meteorConnectEnvironment';
import AccountExportNotice from '../account-export/AccountExportNotice';
import FormButton from '../common/FormButton';
import Container from '../common/styled/Container.css';

const StyledContainer = styled.div`
    &&& {
        margin: 35px 5px 0 5px;
        position: relative;
        text-align: center;

        @media (max-width: 767px) {
            margin: 0;
            overflow: hidden;
            margin-top: -13px;
        }

        svg {
            opacity: 0.4;
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            z-index: -1;

            @media (max-width: 992px) {
                top: -120px;
            }

            @media (max-width: 470px) {
                top: -86px;
                width: 900px;
                left: unset;
            }
        }

        /* The landing's svg rule above positions its background art; keep the notice icon inline. */
        .sunset-notice {
            width: 100%;

            section {
                margin: 24px 0 0;
            }

            svg {
                position: static;
                opacity: 1;
                z-index: auto;
                width: 32px;
            }
        }

        .small-centered {
            padding-top: 20px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }

        h1 {
            font-weight: 600;
        }

        h3 {
            font-weight: 400 !important;
            line-height: 150%;

            span {
                span {
                    font-weight: 500;
                }
            }

            @media (max-width: 767px) {
                font-size: 16px !important;
            }
        }

        .buttons {
            margin-top: 30px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1;

            .blue {
                font-weight: 500 !important;
                margin: 0;
                text-transform: none;

                :not(.link) {
                    min-width: 200px;
                    max-width: 220px;
                    height: auto;
                    text-transform: none;
                    padding: 12px 6px;
                }
            }

            .link {
                text-decoration: none;
                padding: 0;
                :hover {
                    background-color: transparent;
                    text-decoration: underline;
                }
            }

            span {
                margin: 20px;
            }

            @media (min-width: 768px) {
                flex-direction: row;
            }
        }

        .img-wrapper {
            min-height: 300px;

            @media (min-width: 768px) {
                min-height: 600px;
            }
        }

        img {
            margin-top: 65px;
            margin-bottom: 50px;
            width: 500px;
            height: auto;

            @media (min-width: 768px) {
                width: 675px;
                margin-bottom: 75px;
            }
        }

        .email-subscribe {
            margin-top: -140px;
            margin-bottom: 50px;
            padding-top: 80px;

            @media (max-width: 767px) {
                margin-bottom: 0;
                margin-top: -100px;
            }
        }
    }
`;

export function GuestLanding() {
    const { t } = useTranslation();
    const canCreateAccount = isSunsetCapabilityEnabled('createAccount');

    return (
        <StyledContainer>
            <LandingBackground />
            <Container className='small-centered'>
                <h1>
                    <Translate id='landing.title' />
                </h1>
                <h3>
                    <Translate id='landing.desc' />
                </h3>
                {canCreateAccount ? (
                    <div className='buttons'>
                        <FormButton
                            linkTo='/create'
                            trackingId='Click create account button'
                            data-test-id='landingPageCreateAccount'
                        >
                            <Translate id='button.createAccount' />
                        </FormButton>
                        <span>
                            <Translate id='landing.or' />
                        </span>
                        <FormButton
                            data-test-id='homePageImportAccountButton'
                            linkTo='/recover-account'
                            className='link'
                            trackingId='Click import existing link'
                        >
                            <Translate id='button.importExistingAccount' />
                        </FormButton>
                    </div>
                ) : (
                    <>
                        <div className='sunset-notice'>
                            <AccountExportNotice variant='info'>
                                <p>{t('sunset.landing.noNewAccounts')}</p>
                            </AccountExportNotice>
                        </div>
                        <div className='buttons'>
                            <FormButton
                                data-test-id='homePageImportAccountButton'
                                linkTo='/recover-account'
                                trackingId='Click import existing link'
                            >
                                <Translate id='button.importExistingAccount' />
                            </FormButton>
                            <span>
                                <Translate id='landing.or' />
                            </span>
                            <FormButton
                                className='link'
                                linkTo={resolveMeteorWalletWebUrl(
                                    window.location.hostname
                                )}
                                trackingId='Click get Meteor Wallet link'
                            >
                                {t('sunset.common.getMeteor')}
                            </FormButton>
                        </div>
                    </>
                )}
                <div className='img-wrapper'>
                    <img src={iPhoneMockup} alt='Sign up' />
                </div>
            </Container>
        </StyledContainer>
    );
}
