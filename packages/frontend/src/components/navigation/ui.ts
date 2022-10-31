import styled, { css } from 'styled-components';

import { VIEWPORT } from '../../shared/ui/mixins/viewport';

export const StyledHeader = styled.header`
    position: fixed;
    z-index: 5;
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
        width: 100%;
        height: auto;
        padding: 0;
        transition: 300ms;
        border: none;
    }
`;

export const StyledTop = styled.div`
    max-height: 100%;

    @media ${VIEWPORT.TABLET} {
        height: 70px;
        padding: 0 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
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

    @media ${VIEWPORT.TABLET} {
        height: 100vh;
    }
`;

export const StyledLinks = styled.ul`
    margin: 0;
    padding: 1rem 0;
    list-style: none;

    @media ${VIEWPORT.TABLET} {
        padding: 0;
        background-color: var(--mnw-color-8);
    }
`;

export const StyledNavItem = styled.li`
    &:not(:last-child) {
        margin-bottom: 0.2rem;
    }

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

            svg {
                fill: var(--mnw-color-active-text);
            }
        }
    }

    .name {
        margin-left: 1rem;
    }

    @media ${VIEWPORT.TABLET} {
        margin-bottom: 0;
        padding: 0.2rem 0;
        border-bottom: 1px solid var(--mnw-color-9);

        .link {
            color: var(--mnw-color-6);

            &:not(:last-of-type) {
                border: 1px solid red;
            }

            &.active {
                background-color: transparent;
                color: var(--mnw-color-10);
            }
        }
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
