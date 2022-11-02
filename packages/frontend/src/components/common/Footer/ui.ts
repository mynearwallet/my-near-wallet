import styled from 'styled-components';

import { VIEWPORT } from '../../../shared/ui/mixins/viewport';

export const StyledFooter = styled.footer`
    position: absolute;
    right: 0;
    left: 0;
    bottom: 0;
    padding: 35px;
    // Reserved for header
    padding-left: 275px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--mnw-color-6);

    @media ${VIEWPORT.TABLET} {
        padding-left: 35px;
    }
`;

export const StyledWalletInfo = styled.p`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: left;

    @media (min-width: 768px) {
        flex-direction: row;
    }
`;

export const StyledInfoLink = styled.a`
    color: inherit;
    text-decoration: underline;

    &:not(:last-child) {
        position: relative;
        margin-right: 12px;

        &::after {
            position: absolute;
            right: -6px;
            content: '';
            top: 50%;
            transform: translateY(-50%);
            background-color: var(--mnw-color-6);
            width: 1px;
            height: 100%;
        }
    }
`;

export const StyledSocialLinks = styled.div`
    display: none;
    font-size: 18px;
    font-weight: 600;
    line-height: 130%;

    @media (min-width: 768px) {
        display: block;
    }
`;
