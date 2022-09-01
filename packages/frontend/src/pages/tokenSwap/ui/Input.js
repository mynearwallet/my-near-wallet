import React from 'react';
import styled from 'styled-components';

const InputWrapper = styled.div``;

export default function Input({ placeholder = '0.0' }) {
    return (
        <InputWrapper>
            <input placeholder={placeholder} />
        </InputWrapper>
    );
}
