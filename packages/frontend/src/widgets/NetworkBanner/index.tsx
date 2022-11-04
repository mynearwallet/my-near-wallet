import React, { useEffect, FC } from 'react';
import { Translate } from 'react-localize-redux';
import { connect } from 'react-redux';

import Tooltip from '../../components/common/Tooltip';
import AlertTriangleIcon from '../../components/svg/AlertTriangleIcon.js';
import CONFIG from '../../config';
import { Mixpanel } from '../../mixpanel';
import { RESOLUTION } from '../../shared/ui/mixins/viewport';
import { StyledNetworkBanner } from './ui';

const isBannerVisible = !CONFIG.IS_MAINNET || CONFIG.SHOW_PRERELEASE_WARNING;

type NetworkBannerProps = {
    account: { [k: string]: any };
};

const NetworkBanner: FC<NetworkBannerProps> = ({ account }) => {
    useEffect(() => {
        const networkId = CONFIG.IS_MAINNET
            ? 'mainnet'
            : CONFIG.NETWORK_ID === 'default'
                ? 'testnet'
                : CONFIG.NETWORK_ID;

        Mixpanel.register({ network_id: networkId });

        setAppPaddingForBanner();
        window.addEventListener('resize', setAppPaddingForBanner);

        return () => {
            window.removeEventListener('resize', setAppPaddingForBanner);
        };
    }, [account, CONFIG]);

    // @todo Find a better way to display banner. Do positioning of this element in a different place
    const setAppPaddingForBanner = () => {
        const banner = document.getElementById('top-banner');
        const bannerParams = banner?.getBoundingClientRect();
        const bannerHeight = bannerParams ? bannerParams.top + banner.offsetHeight : 0;
        const app = document.getElementById('app-container');
        const header = document.getElementById('header');

        if (isBannerVisible && bannerParams && bannerHeight) {
            if (header) {
                header.style.top = `${bannerHeight}px`;
            }

            if (app && account?.localStorage?.accountFound) {
                const mainContentPadding = bannerParams.width <= RESOLUTION.TABLET ? 85 : 0;

                app.style.paddingTop = `${bannerHeight + mainContentPadding}px`;
            }
        }
    };

    if (!CONFIG.IS_MAINNET) {
        return (
            <StyledNetworkBanner id="top-banner">
                <Translate id="networkBanner.title" />
                <span className="network-link">
                    (
                    <a
                        href={`${CONFIG.NODE_URL}/status`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {
                            CONFIG.NODE_URL.replace(
                                /^(?:https?:\/\/)?(?:www\.)?/i,
                                ''
                            ).split('/')[0]
                        }
                    </a>
                    )
                </span>
                <Tooltip translate="networkBanner.desc" modalOnly />
            </StyledNetworkBanner>
        );
    }

    if (CONFIG.SHOW_PRERELEASE_WARNING) {
        return (
            <StyledNetworkBanner id="top-banner" className="staging-banner">
                <AlertTriangleIcon color="var(--mnw-color-15)" />
                <Translate id="stagingBanner.title" />
                <Tooltip translate="stagingBanner.desc" modalOnly />
            </StyledNetworkBanner>
        );
    }

    return null;
};

// @todo Replace this state type when a global state interface will be ready
const mapStateToProps = (state: { account: any }) => ({
    account: state.account,
});

export default connect(mapStateToProps)(NetworkBanner);
