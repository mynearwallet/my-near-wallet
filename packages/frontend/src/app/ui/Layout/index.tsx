import React, { FC } from 'react';

import Footer from '../../../components/common/Footer';
import User from '../../../widgets/User';
import { StyledLayout, StyledTop, StyledUserWrapper } from './ui';

type MainProps = {
    children: React.ReactChildren;
};

const Layout: FC<MainProps> = ({ children }) => {
    return (
        <StyledLayout>
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
