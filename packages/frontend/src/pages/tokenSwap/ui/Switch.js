import React from 'react';
import styled from 'styled-components';

const SwitchWrapper = styled.div``;

const SwitchButton = styled.button``;

export default function Switch({ onClick }) {
    return (
        <SwitchWrapper>
            <SwitchButton onClick={onClick} /> 
        </SwitchWrapper>
    );
}
