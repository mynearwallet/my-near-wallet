import React from "react";
import { useSelector } from "react-redux";
import { selectNearTokenFiatValueUSD } from "../../../redux/slices/tokenFiatValues";
import BN from "bn.js";
import styled from "styled-components";
import CONFIG from "../../../config";
import classNames from "../../../utils/classNames";
import FiatBalance from "./FiatBalance";
import { formatNearAmount, showInYocto, YOCTO_NEAR_THRESHOLD } from "./helpers";
import { useTranslation } from "react-i18next";

const StyledContainer = styled.div`
    white-space: nowrap;
    line-height: normal;

    .dots {
        color: #4a4f54;
        margin: 0 12px 0 0;

        :after {
            content: '.';
            animation: link 1s steps(5, end) infinite;

            @keyframes link {
                0%, 20% {
                    color: rgba(0,0,0,0);
                    text-shadow:
                        .3em 0 0 rgba(0,0,0,0),
                        .6em 0 0 rgba(0,0,0,0);
                }
                40% {
                    color: #4a4f54;
                    text-shadow:
                        .3em 0 0 rgba(0,0,0,0),
                        .6em 0 0 rgba(0,0,0,0);
                }
                60% {
                    text-shadow:
                        .3em 0 0 #4a4f54,
                        .6em 0 0 rgba(0,0,0,0);
                }
                80%, 100% {
                    text-shadow:
                        .3em 0 0 #4a4f54,
                        .6em 0 0 #4a4f54;
                }
            }
        }
    }

    &.subtract {
        .near-amount {
            :before {
                content: '-'
            }
        }
    }

    &:not(.fiat-only) {
        .fiat-amount {
            color: #72727A;
            font-weight: 400;
            margin-top: 2px;
            font-size: 13px;
        }
    }
`;

interface Props {
    amount: string
    totalAmount?: string
    className?: string
    showSymbolNEAR?: boolean
    showBalanceInNEAR?: boolean
    showBalanceInUSD?: boolean
    showAlmostEqualSignUSD?: boolean
    showSignUSD?: boolean
    showSymbolUSD?: boolean
    "data-test-id"?: string
}

const Balance: React.FunctionComponent<Props> = ({
    totalAmount,
    amount,
    showSymbolNEAR = true,
    showBalanceInNEAR = true,
    showBalanceInUSD = true,
    showAlmostEqualSignUSD,
    showSignUSD,
    showSymbolUSD,
    className,
    "data-test-id": testId,
}) => {
    const { t } = useTranslation()
    const nearTokenFiatValueUSD = useSelector(selectNearTokenFiatValueUSD);
    const amountToShow = amount && formatNearAmount(amount);

    const handleShowInYocto = (amount: string) => {
        if (new BN(amount).lte(YOCTO_NEAR_THRESHOLD)) {
            return showInYocto(amount);
        } else {
            return "";
        }
    };

    return (
      <StyledContainer
        title={handleShowInYocto(amount)}
        className={classNames([
          "balance",
          className,
          {
            "fiat-only": !showBalanceInNEAR,
          },
        ])}
        data-test-id={testId}
      >
        {showBalanceInNEAR && (
          <>
            {amount ? (
              <div className='near-amount'>
                {amountToShow}
                {showSymbolNEAR !== false ? ` ${CONFIG.NEAR_ID}` : ""}
              </div>
            ) : (
              <div className="dots">
                {t("loadingNoDots")}
              </div>
            )}
          </>
        )}
        {showBalanceInUSD && (
          <div className='fiat-amount'>
            <FiatBalance
              totalAmount={totalAmount}
              amount={amount}
              nearTokenFiatValueUSD={nearTokenFiatValueUSD}
              showAlmostEqualSignUSD={showAlmostEqualSignUSD}
              showSignUSD={showSignUSD}
              showSymbolUSD={showSymbolUSD}
            />
          </div>
        )}
      </StyledContainer>
    );
};

export default Balance;
