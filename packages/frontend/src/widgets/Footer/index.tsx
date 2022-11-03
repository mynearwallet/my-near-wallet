import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';

import DiscordIcon from '../../components/svg/DiscordIcon';
import { Mixpanel } from '../../mixpanel/index';
import { StyledFooter, StyledWalletInfo, StyledSocialLinks, StyledInfoLink } from './ui';

const track = (msg: string) => Mixpanel.track(msg);

const currentYear = new Date().getFullYear();

const walletInfoLinks = [
    {
        translationKey: 'terms',
        link: '/terms',
        trackMsg: 'Footer Click terms of service',
    },
    {
        translationKey: 'privacy',
        link: '/privacy',
        trackMsg: 'Footer Click privacy policy',
    },
];

const socialLinks = [
    {
        translationKey: 'discord',
        link: 'https://discord.com/invite/Vj74PpQYsh',
        trackMsg: 'Footer Click Join Community',
        icon: <DiscordIcon color="var(--icon-color)" />,
    },
];

const Footer: FC = () => {
    const { t } = useTranslation();

    const translationsMap = {
        terms: t('footer.termsOfService'),
        privacy: t('footer.privacyPolicy'),
        discord: t('footer.links.discord'),
    };

    return (
        <StyledFooter className="wallet-footer">
            <StyledWalletInfo>
                <p className="copyright">
                    &copy; {currentYear} {t('footer.copyrights')}
                </p>
                <div className='infoLinks'>
                    {walletInfoLinks.map(({ translationKey, link, trackMsg }, index) => (
                        <StyledInfoLink
                            key={index}
                            href={link}
                            rel="noopener noreferrer"
                            target="_blank"
                            onClick={() => track(trackMsg)}
                        >
                            {translationsMap[translationKey]}
                        </StyledInfoLink>
                    ))}
                </div>
            </StyledWalletInfo>
            <StyledSocialLinks>
                {socialLinks.map(({ translationKey, link, trackMsg, icon }, index) => (
                    <a
                        title={translationsMap[translationKey]}
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
