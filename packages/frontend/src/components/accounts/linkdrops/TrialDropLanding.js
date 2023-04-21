import { parse } from "query-string";
import { Translate } from "react-localize-redux";
import styled from "styled-components";
import React, { Component } from "react";

import AccountDropdown from "../../common/AccountDropdown";
import Balance from "../../common/balance/Balance";
import FormButton from "../../common/FormButton";
import Container from "../../common/styled/Container.css";
import NearGiftIcons from "../../svg/NearGiftIcons";

const StyledContainer = styled(Container)`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    .desc {
        color: #72727A;
        margin-bottom: 40px;
    }

    h3 {
        margin-top: 40px;
    }

    button {
        width: 100% !important;
    }
`;

const TrialDropLanding = ({ 
    fundingContract, 
    fundingKey, 
    claimingDrop,
    history
}) => {
    const handleSecureAccount = async () => {    
        let queryString = `?fundingOptions=${encodeURIComponent(JSON.stringify({ fundingContract, fundingKey, fundingAmount: '0', trialDrop: true }))}`;
        history.push(`/set-recovery/${fundingContract}${queryString}`);
    }
    
      return (
        <StyledContainer className='xs-centered'>
          <NearGiftIcons />
          <h3>
            Secure Your Trial Account
          </h3>
          <div className='desc'>
            We hope you enjoyed your trial. Add a seedphrase to secure your account!
          </div>
          
          <FormButton
            data-test-id="linkdropCreateAccountToClaim"
            color="gray-blue"
            disabled={claimingDrop}
            onClick={handleSecureAccount}
          >
            Secure Account
          </FormButton>
          
        </StyledContainer>
      );
};
  
export default TrialDropLanding;
  