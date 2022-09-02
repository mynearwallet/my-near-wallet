import React from 'react';
import styled from 'styled-components';

const InputWrapper = styled.div``;

export default function Input({
    value = '',
    onChange,
    placeholder = '0.0',
    disabled = false,
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
        </InputWrapper>
    );
}
