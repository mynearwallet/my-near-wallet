import styled from 'styled-components';

import { VIEWPORT } from '../../../shared/ui/mixins/viewport';

export const StyledMain = styled.main``;

export const StyledTop = styled.div`
    max-width: 1000px;
    margin: 0 auto;
    padding: 1.8rem 10px 0;
    display: flex;

    @media ${VIEWPORT.TABLET} {
        display: none;
    }
`;

export const StyledAccount = styled.div`
    position: relative;
    margin-left: auto;

    .accountMenu {
        position: absolute;
        top: 50px;
    }
`;
