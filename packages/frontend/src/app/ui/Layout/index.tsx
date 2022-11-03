import React, { FC, ReactNode } from 'react';

import Footer from '../../../components/common/Footer';
import User from '../../../widgets/User';
import Header from '../../../widgets/Header';
import NetworkBanner from '../../../widgets/NetworkBanner';
import { StyledLayout, StyledTop, StyledUserWrapper } from './ui';

type MainProps = {
    children: ReactNode;
};

const Layout: FC<MainProps> = ({ children }) => {
    return (
        <StyledLayout>
            <NetworkBanner />
            <Header />

            <StyledTop>
                <StyledUserWrapper>
                    <User />
                </StyledUserWrapper>
            </StyledTop>

            <main>
                {children}
            </main>

            <Footer />
        </StyledLayout>
    );
};

export default Layout;
