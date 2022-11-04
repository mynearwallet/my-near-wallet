import styled, { css } from 'styled-components';

import languagesIcon from '../../../../images/icon-languages.svg';
import { VIEWPORT } from '../../../../shared/ui/mixins/viewport';

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
        display: none;
    }

    @media ${VIEWPORT.TABLET} {
        .user-account {
            display: flex;
        }
    }
`;

export const StyledNavigation = styled.nav<{ hidden: boolean }>`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow-y: auto;
    background-color: var(--mnw-component-background-1);

    ${(props) =>
        props.hidden &&
        css`
            display: none;
        `}

    @media ${VIEWPORT.TABLET} {
        flex: unset;
        height: 100vh;
        justify-content: unset;
    }
`;

export const StyledFooter = styled.div<{ showDivider: boolean }>`
    padding-top: 1rem;
    position: relative;

    ${(props) =>
        props.showDivider &&
        css`
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
        `}

    @media ${VIEWPORT.TABLET} {
        padding-top: 0;
    }
`;

export const StyledLangSelector = styled.div`
    margin-left: auto;
    padding: 0 0.875rem;

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
