import React, { FC, ReactNode } from 'react';
import { connect } from 'react-redux';

import Footer from '../../../components/common/Footer';
import LangSwitcher from '../../../components/common/LangSwitcher';
import Logo from '../../../shared/ui/core/Logo';
import Header from '../../../widgets/Header';
import NetworkBanner from '../../../widgets/NetworkBanner';
import User from '../../../widgets/User';
import { StyledLayout, StyledTop, StyledUserWrapper, StyledFooterWrapper } from './ui';

type MainProps = {
    children: ReactNode;
    account: {
        localStorage: {
            accountFound: boolean;
        };
    };
};

const Layout: FC<MainProps> = ({ children, account }) => {
    const isRegistered = account?.localStorage?.accountFound;

    // @todo Maybe make new Layout components for a "unregistered-user" flow
    // instead of passing a bunch of the same props
    return (
        <StyledLayout isRegistered={isRegistered}>
            <NetworkBanner />

            {isRegistered && <Header />}

            <StyledTop isRegistered={isRegistered}>
                {isRegistered ? (
                    <StyledUserWrapper>
                        <User />
                    </StyledUserWrapper>
                ) : (
                    <>
                        <Logo isLink mode="mobile" />
                        <LangSwitcher />
                    </>
                )}
            </StyledTop>

            <main>{children}</main>

            <StyledFooterWrapper isRegistered={isRegistered}>
                <Footer />
            </StyledFooterWrapper>
        </StyledLayout>
    );
};

// @todo Replace this state type when a global state interface will be ready
const mapStateToProps = (state: { account: any }) => ({
    account: state.account,
});

export default connect(mapStateToProps)(Layout);
