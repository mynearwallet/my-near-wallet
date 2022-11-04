import styled from 'styled-components';

// import { VIEWPORT } from '../../shared/ui/mixins/viewport';

export const StyledContainer = styled.div`
    min-height: 100vh;

    &.network-banner {
        @media (max-width: 450px) {
            .alert-banner,
            .lockup-avail-transfer {
                margin-top: -45px;
            }
        }
    }

    @media (max-width: 767px) {
        &.hide-footer-mobile {
            .wallet-footer {
                display: none;
            }
        }
    }
`;
