import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

// @todo common component: move to .../common
import Token from '../../../components/send/components/entry_types/Token';

const InputWrapper = styled.div`
    padding: 1rem;
    display: flex;
    flex-direction: column;
    border-radius: 0.5rem;
    border: 1px solid #eceef0;
`;

const Header = styled.div`
    margin-bottom: .4rem;
    display: flex;
    justify-content: space-between;
`;

const Label = styled.span`
    font-size: 0.9rem;
`;

const Balance = styled.button`
    border: none;
`;

const Footer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;

    input {
        flex: 3;
        background-color: #F1F3F5;
    }

    input[disabled] {
        cursor: not-allowed;
    }

    .token {
        flex: 1;
    }
`;

const TokenWrapper = styled.div`
    display: flex;
    height: 64px;
    padding: 15px;
`;

export default function Input({
    value = '',
    loading = false,
    onChange,
    onSelectToken,
    label,
    maxBalance,
    placeholder = '0.0',
    disabled = false,
    tokenSymbol,
    tokenIcon,
}) {
    const handleChange = (event) => {
        event.preventDefault();

        onChange(event.target.value);
    };

    const setMaxBalance = () => onChange(maxBalance);

    return (
        <InputWrapper>
            <Header>
                {label && <Label>{label}</Label>}
                {maxBalance && (
                    <Balance onClick={setMaxBalance}>
                        <Translate
                            id="swap.max"
                            data={{
                                amount: maxBalance,
                                symbol: tokenSymbol,
                            }}
                        />
                    </Balance>
                )}
            </Header>
            <Footer>
                <input
                    type='number'
                    value={loading ? '' : value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    disabled={disabled}
                />
                <TokenWrapper className="token" onClick={onSelectToken}>
                    <Token symbol={tokenSymbol} icon={tokenIcon} />
                </TokenWrapper>
            </Footer>
        </InputWrapper>
    );
}
