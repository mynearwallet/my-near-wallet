import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { Mixpanel } from '../../../mixpanel/index';
import MyNearWalletLogo from '../../svg/MyNearWalletLogo';
import { StyledFooter, StyledLogo } from './ui';

const currentYear = new Date().getFullYear();

const Footer: FC = () => {
    const { t } = useTranslation();

    return (
        <StyledFooter className="wallet-footer">
            <div className="left">
                <StyledLogo>
                    <MyNearWalletLogo mode="footer" />
                </StyledLogo>
                <div>
                    &copy; {currentYear} {t('footer.copyrights')}
                    <div>
                        <a
                            href="/terms"
                            rel="noopener noreferrer"
                            target="_blank"
                            onClick={() =>
                                Mixpanel.track('Footer Click terms of service')
                            }
                        >
                            {t('footer.termsOfService')}
                        </a>
                        <span className="color-brown-grey">|</span>
                        <a
                            href="/privacy"
                            rel="noopener noreferrer"
                            target="_blank"
                            onClick={() => Mixpanel.track('Footer Click privacy policy')}
                        >
                            {t('footer.privacyPolicy')}
                        </a>
                    </div>
                </div>
            </div>
            <div className="center">
                {t('footer.desc')}
                &nbsp;
                <a
                    href="https://near.org"
                    rel="noopener noreferrer"
                    target="_blank"
                    onClick={() => Mixpanel.track('Footer Click Learn More')}
                >
                    {t('footer.learnMore')}
                </a>
            </div>
            <div className="right">
                {t('footer.needHelp')}
                <br />
                <a
                    href="https://discord.com/invite/Vj74PpQYsh"
                    rel="noopener noreferrer"
                    target="_blank"
                    onClick={() => Mixpanel.track('Footer Click Join Community')}
                >
                    {t('footer.contactSupport')}
                </a>
            </div>
        </StyledFooter>
    );
};

export default Footer;
