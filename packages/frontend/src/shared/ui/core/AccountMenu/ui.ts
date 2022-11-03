import styled from 'styled-components';

import { VIEWPORT } from '../../../../shared/ui/mixins/viewport';

export const StyledMenu = styled.div`
    position: fixed;
    top: 70px;
    right: 2.7%;
    border-radius: 8px;
    background-color: var(--mnw-component-background-1);
    color: #4a4f54;
    width: 320px;
    box-shadow: 0px 45px 56px rgba(0, 0, 0, 0.07),
        0px 10.0513px 12.5083px rgba(0, 0, 0, 0.0417275),
        0px 2.99255px 3.72406px rgba(0, 0, 0, 0.0282725);
    padding: 16px;

    .user-links {
        padding: 20px;
    }

    .account-selector {
        padding: 0.375rem 0 0;
        box-shadow: none;
    }

    button {
        width: 100% !important;
    }

    @media ${VIEWPORT.TABLET} {
        position: static;
        box-shadow: none;
        width: 100%;
    }
`;
