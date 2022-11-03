import styled from 'styled-components';

import { VIEWPORT } from '../../../../shared/ui/mixins/viewport';

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
    --navigation-icon-color: var(--mnw-color-6);

    &:not(:last-child) {
        margin-bottom: 0.2rem;
    }

    .link {
        cursor: pointer;
        width: 100%;
        height: 100%;
        max-height: 58px;
        padding: 0.875rem;
        display: flex;
        align-items: center;
        border-radius: 0.5rem;
        white-space: nowrap;
        font-weight: 500;
        font-size: 1rem;
        color: var(--mnw-color-6);
        transition: 80ms;
        text-decoration: none;

        &:hover,
        &:focus,
        &.active {
            --navigation-icon-color: var(--mnw-color-active-text);
            background-color: var(--mnw-color-1);
            color: var(--mnw-color-active-text);
        }

        &.brokenDisplay {
            svg {
                position: relative;
                left: -5px;
            }

            .name {
                margin-left: 0.2rem;
            }
        }
    }

    .name {
        margin-left: 1rem;
    }

    @media ${VIEWPORT.TABLET} {
        margin-bottom: 0;
        padding: 0.18rem 0;
        border-bottom: 1px solid var(--mnw-color-9);

        .link {
            color: var(--mnw-color-6);

            &:not(:last-of-type) {
                border: 1px solid red;
            }

            &:hover,
            &:focus,
            &.active {
                --navigation-icon-color: var(--mnw-color-1);
                background-color: transparent;
                color: var(--mnw-color-10);
            }
        }
    }
`;
