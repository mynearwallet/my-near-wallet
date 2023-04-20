import PropTypes from "prop-types";
import React, { createRef, useEffect, useState } from "react";
import { Translate } from "react-localize-redux";
import styled from "styled-components";

import CONFIG from "../../config";
import { Mixpanel } from "../../mixpanel/index";
import classNames from "../../utils/classNames";
import { ACCOUNT_CHECK_TIMEOUT } from "../../utils/wallet";
import LocalAlertBox from "../common/LocalAlertBox.js";
import useDebouncedValue from "../../hooks/useDebouncedValue";

const InputWrapper = styled.div`
    position: relative;
    display: inline-block;
    font: 16px 'Inter';
    width: 100%;
    overflow: hidden;
    padding: 4px;
    margin: 5px -4px 30px -4px;

    input {
        margin-top: 0px !important;
    }

    &.wrong-char {
        input {
            animation-duration: 0.4s;
            animation-iteration-count: 1;
            animation-name: border-blink;

            @keyframes border-blink {
                0% {
                    box-shadow: 0 0 0 0 rgba(255, 88, 93, 0.8);
                }
                100% {
                    box-shadow: 0 0 0 6px rgba(255, 88, 93, 0);
                }
            }
        }
    }

    &.create {
        .input-suffix {
            position: absolute;
            color: #a6a6a6;
            pointer-events: none;
            top: 50%;
            transform: translateY(-50%);
            visibility: hidden;
        }
    }
`;

const AccountFormAccountId = (props) => {
  const [accountId, setAccountId] = useState(props.defaultAccountId || "");
  const [invalidAccountIdLength, setInvalidAccountIdLength] = useState(false);
  const [wrongChar, setWrongChar] = useState(false);
  const debouncedAccountId = useDebouncedValue(accountId, ACCOUNT_CHECK_TIMEOUT);
  let canvas = null;
  const suffix = createRef();

  useEffect(() => {
    if (props.defaultAccountId) {
      handleChangeAccountId({ userValue: accountId });
    }
  }, []);

  useEffect(() => {
    handleCheckAvailability(accountId, props.type);
  }, [debouncedAccountId])

  const updateSuffix = (userValue) => {
    if (userValue.match(props.pattern)) {
      return;
    }

    const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
    const width = getTextWidth(userValue, "16px Inter");
    const extraSpace = isSafari ? 21.5 : 22;
    suffix.current.style.left = `${width}${extraSpace}px`;
    suffix.current.style.visibility = "visible";
    if (userValue.length === 0) {
      suffix.current.style.visibility = "hidden";
    }
  };

  const getTextWidth = (text, font) => {
    if (!canvas) {
      canvas = document.createElement("canvas");
    }
    const context = canvas.getContext("2d");
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width + 20;
  };

  const handleChangeAccountId = ({ userValue, el }) => {
    const currentAccountId = userValue.toLowerCase();

    if (currentAccountId === accountId) {
      return;
    }

    if (currentAccountId.match(props.pattern)) {
      if (wrongChar) {
        el.style.animation = "none";
        void el.offsetHeight;
        el.style.animation = null;
      } else {
        setWrongChar(true);
      }
      return false;
    } else {
      setWrongChar(false);
    }

    setAccountId(currentAccountId);
    props.handleChange(currentAccountId);
    props.localAlert && props.clearLocalAlert();
    invalidAccountIdLength && handleAccountIdLengthState(currentAccountId);
  };

  const checkAccountIdLength = (accountId) => {
    const accountIdWithSuffix = `${accountId}.${CONFIG.ACCOUNT_ID_SUFFIX}`;
    return accountIdWithSuffix.length >= 2 && accountIdWithSuffix.length <= 64;
  };

  const handleAccountIdLengthState = (accountId) =>
    setInvalidAccountIdLength(!!accountId && !checkAccountIdLength(accountId));

  const handleCheckAvailability = (currentAccountId, type) => {
    if (type === "create") {
      Mixpanel.track("CA Check account availability");
    }
    if (!currentAccountId) {
      return false;
    }
    if (isImplicitAccount(currentAccountId)) {
      return true;
    }
    if (
      !(
        type === "create" &&
        !handleAccountIdLengthState(currentAccountId) &&
        !checkAccountIdLength(currentAccountId)
      )
    ) {
      return props.checkAvailability(type === "create" ? props.accountId : currentAccountId);
    }
    return false;
  };

  const isSameAccount = () => props.type !== "create" && props.stateAccountId === accountId;

  const isImplicitAccount = (accountId) => props.type !== "create" && accountId.length === 64;

  const localAlertWithFormValidation = () => {
    if (!accountId) {
      return null;
    }
    if (isImplicitAccount(accountId)) {
      return {
        success: true,
        messageCode: "account.available.implicitAccount",
      };
    }
    if (props.mainLoader) {
      return {
        messageCode: `account.create.checkingAvailablity.${props.type}`,
      };
    }
    if (invalidAccountIdLength) {
      return {
        success: false,
        messageCode: "account.create.errorInvalidAccountIdLength",
      };
    }
    if (isSameAccount()) {
      return {
        success: false,
        show: true,
        messageCode: "account.available.errorSameAccount",
      };
    }
    return props.localAlert;
  };

  const localAlert = localAlertWithFormValidation();
  const success = localAlert?.success;
  const problem = !localAlert?.success && localAlert?.show;

  return (
    <>
      <Translate>
        {({ translate }) => (
          <InputWrapper
            className={classNames([
              props.type,
              { success: success },
              { problem: problem },
              { "wrong-char": wrongChar },
            ])}
          >
            <input
              name='accountId'
              data-test-id="createAccount.accountIdInput"
              value={accountId}
              onInput={(e) => props.type === "create" && updateSuffix(e.target.value.trim())}
              onChange={(e) =>
                handleChangeAccountId({ userValue: e.target.value.trim(), el: e.target })
              }
              placeholder={
                props.type === "create"
                  ? translate("createAccount.accountIdInput.placeholder", {
                      data: CONFIG.ACCOUNT_ID_SUFFIX,
                    })
                  : translate("input.accountId.placeholder")
              }
              required
              autoComplete='off'
              autoCorrect='off'
              autoCapitalize='off'
              spellCheck='false'
              // rome-ignore lint/a11y/noPositiveTabindex: <explanation>
              tabIndex='1'
              disabled={props.disabled}
            />
            {props.type === "create" && (
              <span className='input-suffix' ref={suffix}>
                .{CONFIG.ACCOUNT_ID_SUFFIX}
              </span>
            )}
            {props.type !== "create" && (
              <div className='input-sub-label'>{translate("input.accountId.subLabel")}</div>
            )}
          </InputWrapper>
        )}
      </Translate>
      <LocalAlertBox dots={props.mainLoader} localAlert={localAlert} accountId={props.accountId} />
    </>
  );
};

AccountFormAccountId.propTypes = {
  mainLoader: PropTypes.bool.isRequired,
  handleChange: PropTypes.func.isRequired,
  checkAvailability: PropTypes.func.isRequired,
  defaultAccountId: PropTypes.string,
  autoFocus: PropTypes.bool,
};

AccountFormAccountId.defaultProps = {
  autoFocus: false,
  pattern: /[^a-zA-Z0-9._-]/,
  type: "check",
};

export default AccountFormAccountId;
