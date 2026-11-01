import React from 'react';
import styled from 'styled-components';

import { isSunsetCapabilityEnabled } from '../../../config/sunset';
import FormButton from '../../common/FormButton';
import Container from '../../common/styled/Container.css';
import FeatureRetiredPage from '../../sunset/FeatureRetiredPage';
import NearGiftIcons from '../../svg/NearGiftIcons';

const StyledContainer = styled(Container)`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    .desc {
        color: #72727a;
        margin-bottom: 40px;
    }

    h3 {
        margin-top: 40px;
    }

    button {
        width: 100% !important;
    }
`;

const TrialDropLanding = ({ fundingContract, fundingKey, claimingDrop, history }) => {
    // Securing a trial account goes through account creation (create_account_and_claim).
    if (!isSunsetCapabilityEnabled('createAccount')) {
        return <FeatureRetiredPage capability='createAccount' route='/linkdrop/trial' />;
    }

    const handleSecureAccount = async () => {
        let queryString = `?fundingOptions=${encodeURIComponent(
            JSON.stringify({
                fundingContract,
                fundingKey,
                fundingAmount: '0',
                trialDrop: true,
            })
        )}`;
        history.push(`/set-recovery/${fundingContract}${queryString}`);
    };

    return (
        <StyledContainer className='xs-centered'>
            <NearGiftIcons />
            <h3>Secure Your Trial Account</h3>
            <div className='desc'>
                We hope you enjoyed your trial. Add a seedphrase to secure your account!
            </div>

            <FormButton
                data-test-id='linkdropCreateAccountToClaim'
                color='gray-blue'
                disabled={claimingDrop}
                onClick={handleSecureAccount}
            >
                Secure Account
            </FormButton>
        </StyledContainer>
    );
};

export default TrialDropLanding;
