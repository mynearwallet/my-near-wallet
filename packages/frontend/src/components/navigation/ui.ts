import styled, { css } from 'styled-components';

import { VIEWPORT } from '../../shared/ui/mixins/viewport';

export const StyledHeader = styled.header`
    position: absolute;
    left: 0;
    top: 0;
    padding: 1.2rem;
    width: 240px;
    height: 100vh;
    background-color: var(--mnw-component-background-1);
    /* TODO: ask about design. This border is for splitting between desktop navigation and main zone.
        Keep just a border for the first iteration?
    */
    border/* -right */: 1px solid #f0f0f1;

    @media ${VIEWPORT.TABLET} {
        padding-left: 0;
        width: 100%;
        height: 70px;
        position: relative;
        padding: 0 14px;
        transition: 300ms;
        border: none;
        border-bottom: 1px solid #f0f0f1;
    }
`;

export const StyledNavigation = styled.nav`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background-color: var(--mnw-component-background-1);

    ${(props) => {
        if (props.hidden) {
            return css`
                display: none;
            `;
        }
    }}
`;

export const StyledTop = styled.div`
    max-height: 100%;

    @media ${VIEWPORT.TABLET} {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
`;

export const StyledLinks = styled.ul`
    margin: 0;
    padding: 1rem 0;
    list-style: none;
`;

export const StyledNavItem = styled.li`
    .link {
        cursor: pointer;
        width: 100%;
        height: 100%;
        padding: 0.875rem;
        display: flex;
        align-items: center;
        border-radius: 0.5rem;
        white-space: nowrap;
        font-weight: 500;
        color: var(--mnw-color-6);
        transition: 80ms;
        text-decoration: none;

        // TODO: fix user-icon size
        // TODO: find a better way to change icon styles
        svg.user-icon {
            width: 24px;
            height: 24px;
        }

        &:hover,
        &.active {
            background-color: var(--color-1);
            color: var(--mnw-color-active-text);
        }
    }

    .name {
        margin-left: 1rem;
    }
`;

export const StyledFooter = styled.div`
    padding-top: 1rem;

    ${(props: { showDivider: boolean }) => {
        if (props.showDivider) {
            return css`
                border-top: 1px solid var(--mnw-color-7);
            `;
        }
    }}
`;
