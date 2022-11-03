import styled from 'styled-components';

import { VIEWPORT } from '../../../shared/ui/mixins/viewport';

export const StyledLayout = styled.div`
    min-height: 100vh;
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
`;

export const StyledTop = styled.div`
    padding: 1.8rem 10px 0;
    display: flex;

    @media ${VIEWPORT.TABLET} {
        display: none;
    }
`;

export const StyledUserWrapper = styled.div`
    margin-left: auto;
`;
