import styled, { css } from 'styled-components';

import languagesIcon from '../../images/icon-languages.svg';
import { VIEWPORT } from '../../shared/ui/mixins/viewport';

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

export const StyledUserAccount = styled.div`
    .user-account {
        position: fixed;
        top: 24px;
        right: 2.7%;
    }

    @media ${VIEWPORT.TABLET} {
        .user-account {
            position: static;
        }
    }
`;

export const StyledNavigation = styled.nav`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow-y: auto;
    background-color: var(--mnw-component-background-1);

    ${(props) => {
        if (props.hidden) {
            return css`
                display: none;
            `;
        }
    }}

    @media ${VIEWPORT.TABLET} {
        flex: unset;
        height: 100vh;
        justify-content: unset;
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

export const StyledFooter = styled.div`
    padding-top: 1rem;
    position: relative;

    ${(props: { showDivider: boolean }) => {
        if (props.showDivider) {
            return css`
                &:before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 50%;
                    width: 90%;
                    transform: translateX(-50%);
                    height: 1px;
                    opacity: 0.5;
                    background-color: var(--mnw-color-12);
                }
            `;
        }
    }}

    @media ${VIEWPORT.TABLET} {
        padding-top: 0;
    }
`;

export const StyledLangSelector = styled.div`
    margin-left: auto;
    padding: 0 0.875rem;
    position: relative;

    &:after {
        content: '';
        display: inline-block;
        position: absolute;
        right: 25px;
        top: calc(50% - 12px);
        transform: rotate(135deg) translateY(-50%);
        height: 9px;
        width: 9px;
        border-style: solid;
        border-width: 2px 2px 0 0;
        border-color: var(--mnw-color-11);
        pointer-events: none;
    }

    .lang-selector {
        width: 100%;
        cursor: pointer;
        appearance: none;
        outline: none;
        height: 32px;
        text-indent: 40px;
        border: 0;
        font-size: 1rem;
        color: var(--mnw-color-11);
        background: transparent url(${languagesIcon}) no-repeat 5px center / 20px 20px;
    }

    @media ${VIEWPORT.TABLET} {
        padding: 0.875rem;
        border-bottom: 1px solid var(--mnw-color-9);
        background-color: var(--mnw-color-8);
    }
`;

export const StyledLink = styled.a`
    width: 100%;
    font-weight: 500;
    font-size: 1rem;
    text-decoration: none;
    color: var(--mnw-color-6);
`;
