import { parse } from "query-string";
import React, { Component } from "react";
import { Translate } from "react-localize-redux";
import { connect } from "react-redux";
import styled from "styled-components";

import { Mixpanel } from "../../mixpanel/index";
import {
  checkLinkdropInfo,
  claimLinkdropToAccount,
  redirectTo,
  handleRefreshUrl,
} from "../../redux/actions/account";
import { clearLocalAlert } from "../../redux/actions/status";
import { selectAccountSlice } from "../../redux/slices/account";
import { actions as linkdropActions } from "../../redux/slices/linkdrop";
import { selectActionsPending, selectStatusMainLoader } from "../../redux/slices/status";
import { isUrlNotJavascriptProtocol } from "../../utils/helper-api";
import AccountDropdown from "../common/AccountDropdown";
import Balance from "../common/balance/Balance";
import FormButton from "../common/FormButton";
import Container from "../common/styled/Container.css";
import BrokenLinkIcon from "../svg/BrokenLinkIcon";
import NearGiftIcons from "../svg/NearGiftIcons";
import NearDropLanding from "./linkdrops/NearDropLanding";
import TrialDropLanding from "./linkdrops/TrialDropLanding";

const { setLinkdropAmount } = linkdropActions;

const StyledContainer = styled(Container)`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    .near-balance {
        color: #0072CE;
        font-weight: 600;
        border: 1px solid #D6EDFF;
        border-radius: 4px;
        padding: 6px 15px;
        background-color: #F0F9FF;
        margin: 30px 0;
    }

    .desc {
        color: #72727A;
        margin-bottom: 40px;
    }

    h3 {
        margin-top: 40px;
    }

    .or {
        color: #A2A2A8;
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

class LinkdropLanding extends Component {
  state = {
    dropType: null,
    keyInfo: null,
    invalidNearDrop: null,
  };

  componentDidMount() {
    const { fundingContract, fundingKey, handleRefreshUrl } = this.props;
    if (fundingContract && fundingKey) {
      this.handleCheckLinkdropInfo();
      handleRefreshUrl();
    }
  }

  handleCheckLinkdropInfo = async () => {
    const { fundingContract, fundingKey, checkLinkdropInfo } = this.props;
    await Mixpanel.withTracking(
      "CA Check near drop balance",
      async () => {
        const keyInfo = await checkLinkdropInfo(fundingContract, fundingKey);

        // If there is trial data and exit is set to false, then the linkdrop should be invalid
        if (keyInfo?.trial_data?.exit === false) {
          this.setState({ invalidNearDrop: true })
        } else {
          this.setState({ keyInfo });
        }
      },
      () => this.setState({ invalidNearDrop: true }),
    );
  };

  handleClaimNearDrop = async () => {
    const {
      fundingContract,
      fundingKey,
      redirectTo,
      claimLinkdropToAccount,
      accountId,
      url,
      setLinkdropAmount,
    } = this.props;
    await claimLinkdropToAccount(fundingContract, fundingKey);
    if (url?.redirectUrl && isUrlNotJavascriptProtocol(url?.redirectUrl)) {
      window.location = `${url.redirectUrl}?accountId=${accountId}`;
    } else {
      setLinkdropAmount(this.state.keyInfo.yoctoNEAR);
      redirectTo("/");
    }
  };

  render() {
    const { fundingContract, fundingKey, accountId, mainLoader, history, claimingDrop } =
      this.props;
    const { keyInfo, invalidNearDrop } = this.state;
    const fundingAmount = keyInfo?.yoctoNEAR || '0';
    const isTrialDrop = keyInfo?.trial_data?.exit || false

    if (!invalidNearDrop) {
      if (isTrialDrop) {
        return (
            <TrialDropLanding 
                fundingContract={fundingContract} 
                fundingKey={fundingKey}
                claimingDrop={claimingDrop}
                history={history}
            />
          );
      }

      return (
        <NearDropLanding 
            fundingContract={fundingContract} 
            fundingKey={fundingKey}
            accountId={accountId}
            mainLoader={mainLoader}
            history={history}
            claimingDrop={claimingDrop}
            fundingAmount={fundingAmount}
            handleClaimNearDrop={this.handleClaimNearDrop}
        />
      );
    } else {
      return (
        <StyledContainer className='small-centered invalid-link'>
          <BrokenLinkIcon />
          <h1>
            <Translate id='createAccount.invalidLinkDrop.title' />
          </h1>
          <h2>
            <Translate id='createAccount.invalidLinkDrop.one' />
          </h2>
          <h2>
            <Translate id='createAccount.invalidLinkDrop.two' />
          </h2>
        </StyledContainer>
      );
    }
  }
}

const mapDispatchToProps = {
  clearLocalAlert,
  checkLinkdropInfo,
  claimLinkdropToAccount,
  redirectTo,
  handleRefreshUrl,
  setLinkdropAmount,
};

const mapStateToProps = (state, { match }) => ({
  ...selectAccountSlice(state),
  fundingContract: match.params.fundingContract,
  fundingKey: match.params.fundingKey,
  mainLoader: selectStatusMainLoader(state),
  claimingDrop: selectActionsPending(state, { types: ["CLAIM_LINKDROP_TO_ACCOUNT"] }),
});

const LinkdropLandingWithRouter = connect(mapStateToProps, mapDispatchToProps)(LinkdropLanding);

export default LinkdropLandingWithRouter;
