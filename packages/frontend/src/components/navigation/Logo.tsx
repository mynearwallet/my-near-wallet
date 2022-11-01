import React, { FC } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { VIEWPORT } from '../../shared/ui/mixins/viewport';
import MyNearWalletLogo from '../svg/MyNearWalletLogo';

const StyledLogo = styled.div`
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

type LogoProps = {
    link: boolean;
    mode?: 'mobile';
};

const Logo: FC<LogoProps> = ({ link, mode }) => (
    <StyledLogo>
        {link ? (
            <Link to="/">
                <MyNearWalletLogo mode={mode} />
            </Link>
        ) : (
            <MyNearWalletLogo mode={mode} />
        )}
    </StyledLogo>
);

export default Logo;
