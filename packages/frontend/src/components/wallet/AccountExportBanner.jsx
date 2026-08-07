import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const AccountExportBannerContainer = styled.section`
    margin-bottom: 28px;
`;

const AccountExportBannerContent = styled.div`
    align-items: center;
    background: linear-gradient(105deg, #6686f4 0%, #65bfe0 100%);
    border-radius: 20px;
    display: flex;
    justify-content: space-between;
    padding: 24px 42px;

    @media (max-width: 600px) {
        align-items: stretch;
        border-radius: 14px;
        flex-direction: column;
        padding: 20px;
    }
`;

const BannerCopy = styled.div`
    max-width: 740px;
`;

const BannerTitle = styled.h2`
    color: #fff;
    font-size: 20px;
    font-weight: 700;
    line-height: 26px;
    margin: 0;
`;

const BannerDescription = styled.p`
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    line-height: 21px;
    margin: 6px 0 0;
`;

const BannerLink = styled(Link)`
    align-items: center;
    background: #fff;
    border: 2px solid #fff;
    border-radius: 50px;
    color: #0072ce;
    display: flex;
    font-size: 16px;
    font-weight: 700;
    height: 48px;
    justify-content: center;
    line-height: 24px;
    margin-left: 32px;
    min-width: 250px;
    text-align: center;

    &:hover {
        background: #f5f8ff;
        border-color: #f5f8ff;
        color: #0063b4;
    }

    @media (max-width: 600px) {
        margin: 20px 0 0;
        width: 100%;
    }
`;

export default function AccountExportBanner() {
    return (
        <AccountExportBannerContainer>
            <AccountExportBannerContent>
                <BannerCopy>
                    <BannerTitle>MyNearWallet Is Sunsetting</BannerTitle>
                    <BannerDescription>
                        MyNearWallet is being sunset. Export your accounts to continue
                        accessing them securely.
                    </BannerDescription>
                </BannerCopy>
                <BannerLink to='/export-accounts/select'>Export Accounts</BannerLink>
            </AccountExportBannerContent>
        </AccountExportBannerContainer>
    );
}
