import { parse } from 'query-string';
import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import AccountDropdown from '../../common/AccountDropdown';
import Balance from '../../common/balance/Balance';
import FormButton from '../../common/FormButton';
import Container from '../../common/styled/Container.css';
import NearGiftIcons from '../../svg/NearGiftIcons';

const StyledContainer = styled(Container)`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    .near-balance {
        color: #0072ce;
        font-weight: 600;
        border: 1px solid #d6edff;
        border-radius: 4px;
        padding: 6px 15px;
        background-color: #f0f9ff;
        margin: 30px 0;
    }

    .desc {
        color: #72727a;
        margin-bottom: 40px;
    }

    h3 {
        margin-top: 40px;
    }

    .or {
        color: #a2a2a8;
        margin: 20px 0 -6px 0;
    }

    button {
        width: 100% !important;
    }

    .account-dropdown-container {
        width: 100%;
    }

    &.invalid-link {
        svg {
            display: block;
            margin: 0 auto;
        }

        h2 {
            margin-top: 20px;
        }
    }
`;

const NearDropLanding = ({
    fundingContract,
    fundingKey,
    accountId,
    mainLoader,
    history,
    claimingDrop,
    fundingAmount,
    handleClaimNearDrop,
}) => {
    const params = parse(history.location.search);
    const redirectUrl = params.redirectUrl
        ? `&redirectUrl=${encodeURIComponent(params.redirectUrl)}`
        : '';

    return (
        <StyledContainer className='xs-centered'>
            <NearGiftIcons />
            <h3>
                <Translate id='linkdropLanding.title' />
            </h3>
            <div className='near-balance'>
                <Balance data-test-id='linkdropBalanceAmount' amount={fundingAmount} />
            </div>
            <div className='desc'>
                <Translate id='linkdropLanding.desc' />
            </div>

            {accountId ? (
                <AccountDropdown
                    disabled={claimingDrop}
                    data-test-id='linkdropAccountDropdown'
                />
            ) : null}

            {accountId ? (
                <FormButton
                    onClick={handleClaimNearDrop}
                    sending={claimingDrop}
                    disabled={mainLoader}
                    sendingString='linkdropLanding.claiming'
                    data-test-id='linkdropClaimToExistingAccount'
                >
                    <Translate id='linkdropLanding.ctaAccount' />
                </FormButton>
            ) : (
                <FormButton
                    linkTo={`/recover-account?fundingOptions=${encodeURIComponent(
                        JSON.stringify({ fundingContract, fundingKey, fundingAmount })
                    )}${redirectUrl}`}
                    data-test-id='linkdropLoginAndClaim'
                >
                    <Translate id='linkdropLanding.ctaLogin' />
                </FormButton>
            )}
            <div className='or'>
                <Translate id='linkdropLanding.or' />
            </div>
            <FormButton
                data-test-id='linkdropCreateAccountToClaim'
                color='gray-blue'
                disabled={claimingDrop}
                linkTo={`/create/${fundingContract}/${fundingKey}`}
            >
                <Translate id='linkdropLanding.ctaNew' />
            </FormButton>
        </StyledContainer>
    );
};

export default NearDropLanding;
