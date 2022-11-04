import styled from 'styled-components';

import { VIEWPORT } from '../../../../shared/ui/mixins/viewport';

export const StyledLogo = styled.div`
    padding: 0 0.8rem;

    svg {
        width: 170px;
    }

    @media ${VIEWPORT.TABLET} {
        max-width: 44px;
        padding: 0;

        svg {
            #mynearwallet_logo_text {
                display: none;
            }
        }
    }
`;
