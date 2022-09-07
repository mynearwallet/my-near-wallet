import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

// @todo common component: move to .../common
import Token from '../../../components/send/components/entry_types/Token';

const InputWrapper = styled.div`
    margin: 34px 0 0 0;
    padding: 8px 16px 16px;
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    border: 1px solid #eceef0;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
`;

const Label = styled.div``;

const Balance = styled.button``;

const Footer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;

    input {
        flex: 3;
    }

    .token {
        flex: 1;
    }
`;

const TokenWrapper = styled.div`
    display: flex;
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
