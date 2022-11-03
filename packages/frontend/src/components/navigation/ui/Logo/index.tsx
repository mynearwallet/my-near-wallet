import React, { FC } from 'react';
import { Link } from 'react-router-dom';

import MyNearWalletLogo from '../../../svg/MyNearWalletLogo';
import { StyledLogo } from './ui';

type LogoProps = {
    isLink: boolean;
    mode?: 'mobile';
};

const Logo: FC<LogoProps> = ({ isLink, mode }) => (
    <StyledLogo>
        {isLink ? (
            <Link to="/">
                <MyNearWalletLogo mode={mode} />
            </Link>
        ) : (
            <MyNearWalletLogo mode={mode} />
        )}
    </StyledLogo>
);

export default Logo;
