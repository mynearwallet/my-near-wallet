import styled from 'styled-components';

import { VIEWPORT } from '../../shared/ui/mixins/viewport';

export const StyledFooter = styled.footer`
    margin-top: auto;
    padding: 35px 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--mnw-color-6);

    @media ${VIEWPORT.TABLET} {
        // @todo change for Mobile view 
    }
`;

export const StyledWalletInfo = styled.div`
    display: flex;
    flex-direction: column;
    text-align: left;

    .copyright {
        margin: 0;
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
    --icon-color: var(--mnw-color-6);
`;
