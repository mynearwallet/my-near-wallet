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
    background-color: #f8f8f8;
    font-size: 12px;
    color: #999999;
    display: flex;
    align-items: center;
    justify-content: center;

    @media (min-width: 768px) {
        justify-content: space-between;
    }

    @media ${VIEWPORT.TABLET} {
        padding-left: 35px;
    }

    .left {
        display: flex;
        flex-direction: column;
        align-items: center;

        @media (min-width: 768px) {
            flex-direction: row;
        }

        > div {
            text-align: center;
            margin: 20px 0 0 0;

            @media (min-width: 768px) {
                text-align: left;
                margin: 0 0 0 20px;
            }

            .color-brown-grey {
                margin: 0 5px;
            }
        }

        img {
            opacity: 0.3;
            width: 125px;
        }

        a {
            color: #999999;
            text-decoration: underline;
        }
    }

    .center {
        display: none;
        color: #24272a;
        width: 30%;

        @media (min-width: 992px) {
            display: block;
        }
    }

    .right {
        display: none;
        font-size: 18px;
        font-weight: 600;
        line-height: 130%;

        @media (min-width: 768px) {
            display: block;
        }
    }
`;

export const StyledLogo = styled.div`
    svg {
        width: 218px;
    }
`;
