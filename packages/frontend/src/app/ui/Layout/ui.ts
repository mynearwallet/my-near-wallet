import styled, { css } from 'styled-components';

import { VIEWPORT } from '../../../shared/ui/mixins/viewport';

const SIDEBAR_WIDTH = 240;

// @todo Review other component styles and remake this layout with grid
export const StyledLayout = styled.div<{ isRegistered: boolean }>`
    // Padding reserved for footer height
    padding-bottom: 230px;
    padding-top: 35px;

    @media ${VIEWPORT.TABLET} {
        padding-left: 0;
    }

    ${({ isRegistered }) =>
        isRegistered &&
        css`
            // Padding reserved for sidebar
            padding-left: ${SIDEBAR_WIDTH + 24}px;
            padding-top: 0;
        `}
`;

export const StyledTop = styled.div<{ isRegistered: boolean }>`
    margin: 0 auto;
    padding: 0 10px;
    display: flex;
    justify-content: space-between;

    ${({ isRegistered }) =>
        isRegistered &&
        css`
            padding: 1.8rem 10px 0;
            max-width: 1000px;
        `}

    @media ${VIEWPORT.TABLET} {
        // @todo Temporarily hide this part, because we keep old mobile menu
        // where we have the same content as in this block
        ${({ isRegistered }) =>
            isRegistered &&
            css`
                display: none;
            `}
    }
`;

export const StyledUserWrapper = styled.div`
    margin-left: auto;
`;

export const StyledFooterWrapper = styled.div<{ isRegistered: boolean }>`
    position: absolute;
    right: 0;
    left: 0;
    bottom: 0;

    ${({ isRegistered }) =>
        isRegistered &&
        css`
            padding-left: ${SIDEBAR_WIDTH}px;
        `}

    @media ${VIEWPORT.TABLET} {
        padding-left: 0;
    }
`;
