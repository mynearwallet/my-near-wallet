import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { Mixpanel } from '../../../mixpanel/index';
// import {  } from '../../../components/svg/';
import { StyledFooter, StyledWalletInfo, StyledSocialLinks, StyledInfoLink } from './ui';

const track = (msg: string) => Mixpanel.track(msg);

const currentYear = new Date().getFullYear();

const walletInfoLinks = [
    {
        nameId: 'footer.termsOfService',
        link: '/terms',
        trackMsg: 'Footer Click terms of service',
    },
    {
        nameId: 'footer.privacyPolicy',
        link: '/privacy',
        trackMsg: 'Footer Click privacy policy',
    },
];

const socialLinks = [
    {
        nameId: 'discord',
        link: 'https://discord.com/invite/Vj74PpQYsh',
        trackMsg: 'Footer Click Join Community',
        icon: 'Discord icon',
        // icon: <Icon color="var(--navigation-icon-color)" />,
    },
];

const Footer: FC = () => {
    const { t } = useTranslation();

    return (
        <StyledFooter className="wallet-footer">
            <StyledWalletInfo>
                <div>
                    &copy; {currentYear} {t('footer.copyrights')}
                    <div>
                        {walletInfoLinks.map(({ nameId, link, trackMsg }, index) => (
                            <StyledInfoLink
                                key={index}
                                href={link}
                                rel="noopener noreferrer"
                                target="_blank"
                                onClick={() => track(trackMsg)}
                            >
                                {t(nameId)}
                            </StyledInfoLink>
                        ))}
                    </div>
                </div>
            </StyledWalletInfo>
            <StyledSocialLinks>
                {socialLinks.map(({ nameId, link, trackMsg, icon }, index) => (
                    <a
                        title={t(nameId)}
                        key={index}
                        href={link}
                        rel="noopener noreferrer"
                        target="_blank"
                        onClick={() => track(trackMsg)}
                    >
                        {icon}
                    </a>
                ))}
            </StyledSocialLinks>
        </StyledFooter>
    );
};

export default Footer;
