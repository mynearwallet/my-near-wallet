import React, { memo, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import SafeTranslate from '../../../components/SafeTranslate';
// @todo common component: move to .../common
import Token from '../../../components/send/components/entry_types/Token';
import ChevronIcon from '../../../components/svg/ChevronIcon';
import { formatTokenAmount, isValidAmount } from '../../../utils/amounts';

const InputWrapper = styled.div`
    padding: 1rem;
    display: flex;
    flex-direction: column;
    border-radius: 0.5rem;
    border: 1px solid #eceef0;
    background-color: #fbfcfd;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
`;

const Label = styled.span`
    font-size: 0.9rem;
`;

const Balance = styled.button`
    font-style: italic;
    color: #2f98f3;
    cursor: pointer;
    background-color: transparent;
    border: none;

    &.disabled {
        cursor: default;
    }

    :hover:not(.disabled) {
        text-decoration: underline;
    }
`;

const Footer = styled.div`
    display: grid;
    grid-template-columns: 184px 1fr;
    column-gap: 16px;
    margin-top: 16px;

    @media screen and (max-width: 767px) {
        grid-template-columns: 1fr 1fr;
    }

    input {
        text-align: right;
        padding: 0 15px 0 15px;
        height: 64px;
        margin-top: 0;
        background-color: #f1f3f5;

        :focus {
            background-color: #ffffff;
        }
    }

    input.error {
        border-color: #fc5b5b;
        color: #fc5b5b;
    }

    .token {
        flex: 1;
    }
`;

const TokenWrapper = styled.div`
    display: flex;
    align-items: center;
    padding: 15px;
    background-color: #f1f3f5;
    border-radius: 8px;
    transition: 100ms;
    height: 64px;
    cursor: pointer;

    > div {
        width: 100%;
        padding: 0px;
        color: #272729;
        font-weight: 600;
    }

    .icon {
        margin-right: 15px;
    }
`;

export default memo(function Input({
    value = '',
    loading = false,
    onChange,
    onSelectToken,
    label,
    maxBalance = 0,
    placeholder = '0.0',
    disabled = false,
    tokenSymbol,
    tokenIcon,
    tokenDecimals,
    setIsValidInput,
    inputTestId,
    tokenSelectTestId,
}) {
    const handleChange = (event) => {
        event.preventDefault();

        onChange(event.target.value);
    };

    const humanBalanceFormat = useMemo(() => {
        return maxBalance ? formatTokenAmount(maxBalance, tokenDecimals) : null;
    }, [maxBalance]);

    const [isWrongBalance, setIsWrongBalance] = useState(false);

    useEffect(() => {
        const invalid =
            !disabled &&
            value &&
            !isValidAmount(value, humanBalanceFormat, tokenDecimals);

        if (setIsValidInput) {
            setIsValidInput(!invalid);
        }

        setIsWrongBalance(invalid);
    }, [disabled, value, humanBalanceFormat, tokenDecimals]);

    const setMaxBalance = () => !disabled && onChange(humanBalanceFormat);

    const balanceData = {
        amount: humanBalanceFormat,
        symbol: tokenSymbol,
    };

    return (
        <InputWrapper>
            <Header>
                {label && <Label>{label}</Label>}
                {humanBalanceFormat && (
                    <Balance onClick={setMaxBalance} className={`${disabled ? 'disabled' : ''}`}>
                        <SafeTranslate id="swap.max" data={balanceData} />
                    </Balance>
                )}
            </Header>
            <Footer>
                <TokenWrapper
                    className="token"
                    onClick={onSelectToken}
                    data-test-id={tokenSelectTestId}
                >
                    <Token symbol={tokenSymbol} icon={tokenIcon} />
                    <ChevronIcon color="#0072ce" />
                </TokenWrapper>
                <input
                    className={`${isWrongBalance ? 'error' : ''}`}
                    type="number"
                    min={0}
                    max={humanBalanceFormat || 0}
                    value={loading ? '' : value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    data-test-id={inputTestId}
                />
            </Footer>
        </InputWrapper>
    );
});
