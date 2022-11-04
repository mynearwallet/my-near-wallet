import styled from 'styled-components';

import { VIEWPORT } from '../../../shared/ui/mixins/viewport';

export const StyledHeader = styled.header`
    position: fixed;
    z-index: 5;
    left: 0;
    top: 0;
    bottom: 0;
    padding: 0 0.8rem 1.2rem;
    width: 240px;
    display: flex;
    flex-direction: column;
    background-color: var(--mnw-component-background-1);
    // @todo Temporarily split Header and Main wallet zones
    // Remove when the Main zone will be with a different background color
    border-right: 1px solid #f0f0f1;

    @media ${VIEWPORT.TABLET} {
        width: 100%;
        bottom: auto;
        padding: 0;
        transition: 300ms;
        border: none;
    }
`;
