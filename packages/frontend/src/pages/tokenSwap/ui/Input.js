import React from 'react';
import styled from 'styled-components';

// @todo common component: move to .../common
import Token from '../../../components/send/components/entry_types/Token';
import ChevronIcon from '../../../components/svg/ChevronIcon';

const InputWrapper = styled.div`
    display: flex;
    align-items: center;
`;

const TokenWrapper = styled.div`
    display: flex;
`;

export default function Input({
    value = '',
    loading = false,
    onChange,
    onSelectToken,
    placeholder = '0.0',
    disabled = false,
    tokenSymbol,
    tokenIcon,
}) {
    const handleChange = (event) => {
        event.preventDefault();

        onChange(event.target.value);
    };

    return (
        <InputWrapper>
            <input
                type='number'
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                disabled={disabled}
            />
            <TokenWrapper onClick={onSelectToken}>
                <ChevronIcon color="#0072ce" />
                <Token symbol={tokenSymbol} icon={tokenIcon} />
            </TokenWrapper>
        </InputWrapper>
    );
}
