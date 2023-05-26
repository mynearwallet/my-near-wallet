import React from 'react';
import styled from 'styled-components';

const StyledContainer = styled.div`
    &&& {
        margin: 25px -25px -25px -25px;
        padding: 25px;
        border-top: 1px solid #f0f0f1;

        > button {
            margin: 0;
        }
    }
`;

export default ({ children }) => (
    <StyledContainer className='modal-footer'>{children}</StyledContainer>
);
