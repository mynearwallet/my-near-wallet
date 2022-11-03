import styled, { css } from 'styled-components';

import { VIEWPORT } from '../../../shared/ui/mixins/viewport';

export const StyledHeader = styled.header`
    position: fixed;
    z-index: 5;
    left: 0;
    top: 0;
    padding: 0 0.8rem 1.2rem;
    width: 240px;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--mnw-component-background-1);
    border-right: 1px solid #f0f0f1;

    @media ${VIEWPORT.TABLET} {
        width: 100%;
        height: auto;
        padding: 0;
        transition: 300ms;
        border: none;
    }
`;
