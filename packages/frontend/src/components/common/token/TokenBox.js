import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import { CREATE_USN_CONTRACT } from '../../../../../../features';
import { EXPLORER_URL, NEAR_ID } from '../../../config';
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

    .desc {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        margin-left: 14px;
        display: block;
        min-width: ${({ IS_USN }) => (IS_USN ? '55px' : 0)};
        margin-right: ${({ IS_USN }) => (IS_USN ? '25px' : 0)};

        .symbol {
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

        .fiat-rate {
            color: #72727a;
            margin-top: 6px;
            white-space: nowrap;
            display: block;
            width: fit-content;

            > span {
                background-color: #f0f0f1;
                padding: 2px 10px;
                border-radius: 40px;
                font-size: 12px;
                display: block;
            }
        }
    }

    .balanceMargin {
        margin-left: auto;
        font-size: 16px;
        font-weight: 600;
        color: #24272a;
        text-align: ${({ IS_USN }) => (IS_USN ? 'left' : 'right')};
        white-space: nowrap;

        .fiat-amount {
            font-size: 14px;
            font-weight: 400;
            margin-top: 6px;
            color: #72727a;
            line-height: normal;
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

const TokenTitle = ({ title, isLinkTitle }) => {
    const stopPropagation = (event) => event.stopPropagation();

    return (
        <span className='symbol' title={title}>
            {isLinkTitle ? (
                <a
                    href={`${EXPLORER_URL}/accounts/${title}`}
                    onClick={stopPropagation}
                    target='_blank'
                    rel='noopener noreferrer'
                >
                    {title}
                </a>
            ) : (
                title
            )}
        </span>
    );
};

const TokenBox = ({ token, onClick, currentLanguage }) => {
    const { symbol = '', name = '', icon = '' } = token.onChainFTMetadata;
    const title = symbol || name;

    return (
        <StyledContainer
            className='token-box'
            onClick={onClick ? () => onClick(token) : null}
            data-test-id={`token-selection-${token.contractName || NEAR_ID}`}
            IS_USN={CREATE_USN_CONTRACT && symbol === 'USN'}
        >
            <div style={{ display: 'flex', width: '100%' }}>
                <div className='icon'>
                    <TokenIcon symbol={symbol} icon={icon} />
                </div>
                <div className='desc'>
                    <TokenTitle
                        title={title}
                        isLinkTitle={!!token.contractName}
                    />
                    <span className='fiat-rate'>
                        {token.fiatValueMetadata?.usd ? (
                            <>
                                $
                                {new Intl.NumberFormat(`${currentLanguage}`, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                }).format(token.fiatValueMetadata?.usd)}
                            </>
                        ) : (
                            <span>
                                <Translate id='tokenBox.priceUnavailable' />
                            </span>
                        )}
                    </span>
                </div>
                {symbol === NEAR_ID && !token.contractName ? (
                    <div className='balance'>
                        <Balance
                            amount={token.balance}
                            data-test-id='walletHomeNearBalance'
                            symbol={false}
                            showSymbolNEAR={!CREATE_USN_CONTRACT}
                        />
                    </div>
                ) : (
                    <TokenAmount
                        token={token}
                        className={
                            symbol !== 'USN' && CREATE_USN_CONTRACT
                                ? 'balance tokenAmount'
                                : 'balance'
                        }
                    />
                )}
            </div>
        </StyledContainer>
    );
};

export default TokenBox;
