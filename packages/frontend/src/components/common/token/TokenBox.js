import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import CONFIG from '../../../config';
import Balance from '../balance/Balance';
import TokenAmount from './TokenAmount';
import TokenIcon from './TokenIcon';

const StyledContainer = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 15px 14px;

    @media (max-width: 767px) {
        margin: 0 -14px;
    }

    @media (min-width: 992px) {
        padding: 15px 20px;
    }

    .icon {
        width: 32px;
        height: 32px;
        min-width: 32px;
        min-height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: 50%;
        box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.15);
        align-self: center;

        img,
        svg {
            height: 32px;
            width: 32px;
        }
    }

    .description {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        min-width: 0px;
        margin-left: 14px;
        display: block;

        .title {
            font-weight: 700;
            font-size: 16px;
            color: #24272a;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: block;
            margin-right: 10px;

            a {
                color: inherit;
            }
        }

        .subTitle {
            color: #72727a;
            margin-top: 6px;
            display: block;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;

            > span {
                background-color: #f0f0f1;
                padding: 2px 10px;
                border-radius: 40px;
                font-size: 12px;
                display: block;
            }
        }
    }

    .balance {
        margin-left: auto;
        font-size: 16px;
        font-weight: 600;
        color: #24272a;
        text-align: right;
        white-space: nowrap;

        .fiat-amount {
            font-size: 14px;
            font-weight: 400;
            margin-top: 6px;
            color: #72727a;
            line-height: normal;
        }

        .dots {
            :after {
                position: absolute;
                content: '.';
                font-weight: 300;
                animation: link 1s steps(5, end) infinite;

                @keyframes link {
                    0%,
                    20% {
                        color: rgba(0, 0, 0, 0);
                        text-shadow: 0.3em 0 0 rgba(0, 0, 0, 0),
                            0.6em 0 0 rgba(0, 0, 0, 0);
                    }
                    40% {
                        color: #24272a;
                        text-shadow: 0.3em 0 0 rgba(0, 0, 0, 0),
                            0.6em 0 0 rgba(0, 0, 0, 0);
                    }
                    60% {
                        text-shadow: 0.3em 0 0 #24272a,
                            0.6em 0 0 rgba(0, 0, 0, 0);
                    }
                    80%,
                    100% {
                        text-shadow: 0.3em 0 0 #24272a, 0.6em 0 0 #24272a;
                    }
                }
            }
        }
    }
`;

const TokenBoxWrapper = styled.div`
    width: 100%;
    display: flex;
`;

const Title = ({ content, title }) => {
    const stopPropagation = (event) => event.stopPropagation();

    return (
        <span className='title' title={title || content}>
            {title && title !== CONFIG.NEAR_ID ? (
                <a
                    href={`${CONFIG.EXPLORER_URL}/accounts/${title}`}
                    onClick={stopPropagation}
                    target='_blank'
                    rel='noopener noreferrer'
                >
                    {content}
                </a>
            ) : (
                content
            )}
        </span>
    );
};

const SubTitle = ({ showFiatPrice, price, currentLanguage, name = '-' }) => {
    const fiatDecimals = 2;

    return (
        <span className="subTitle">
            {showFiatPrice ? (
                price ? (
                    <>
                        $
                        {new Intl.NumberFormat(`${currentLanguage}`, {
                            minimumFractionDigits: fiatDecimals,
                            maximumFractionDigits: fiatDecimals,
                        }).format(price)}
                    </>
                ) : (
                    <span>
                        <Translate id="tokenBox.priceUnavailable" />
                    </span>
                )
            ) : (
                name
            )}
        </span>
    );
};

const TokenBox = ({ token, onClick, currentLanguage, showFiatPrice = false }) => {
    const { symbol = '', name = '', icon = '' } = token.onChainFTMetadata;

    const selectToken = () => {
        if (typeof onClick === 'function') {
            onClick(token);
        }
    };

    return (
        <StyledContainer
            className='token-box'
            onClick={selectToken}
            data-test-id={`token-selection-${token.contractName || CONFIG.NEAR_ID}`}
        >
            <TokenBoxWrapper>
                <div className='icon'>
                    <TokenIcon symbol={symbol} icon={icon} />
                </div>
                <div className='description'>
                    <Title title={token.contractName} content={symbol} />
                    <SubTitle
                        showFiatPrice={showFiatPrice}
                        currentLanguage={currentLanguage}
                        name={name || symbol}
                        price={token.fiatValueMetadata?.usd}
                    />
                </div>
                {!token.contractName || token.contractName === CONFIG.NEAR_ID ? (
                    <div className='balance'>
                        <Balance
                            amount={token.balance}
                            data-test-id='walletHomeNearBalance'
                            symbol={false}
                            showSymbolNEAR={false}
                        />
                    </div>
                ) : (
                    <TokenAmount
                        token={token}
                        className="balance"
                    />
                )}
            </TokenBoxWrapper>
        </StyledContainer>
    );
};

export default TokenBox;
