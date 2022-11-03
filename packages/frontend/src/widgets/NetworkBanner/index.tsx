import React, { useEffect, FC } from 'react';
import { Translate } from 'react-localize-redux';
import { connect } from 'react-redux';

import CONFIG from '../../config';
import { Mixpanel } from '../../mixpanel';
import AlertTriangleIcon from '../../components/svg/AlertTriangleIcon.js';
import Tooltip from '../../components/common/Tooltip';
import { StyledNetworkBanner } from './ui'

const isBannerVisible = !CONFIG.IS_MAINNET || CONFIG.SHOW_PRERELEASE_WARNING;

type NetworkBannerProps = {
    account: { [k: string]: any }
}

const NetworkBanner: FC<NetworkBannerProps> = ({ account }) => {
    useEffect(() => {
        // @ts-ignore
        Mixpanel.register({ network_id: CONFIG.IS_MAINNET ? 'mainnet' : CONFIG.NETWORK_ID === 'default' ? 'testnet' : CONFIG.NETWORK_ID });
        setBannerHeight();
        window.addEventListener('resize', setBannerHeight);
        return () => {
            window.removeEventListener('resize', setBannerHeight);
        };
    }, [account]);

    // TODO: find a better way to display this component. Do not access html elements directly
    const setBannerHeight = () => {
        const banner = document.getElementById('top-banner');
        const bannerHeight = banner ? banner.getBoundingClientRect().top + banner.offsetHeight : 0;
        const app = document.getElementById('app-container');
        const navContainer = document.getElementById('nav-container');
        navContainer.style.top = bannerHeight ? `${bannerHeight}px` : '0';

        if (isBannerVisible) {
            app.style.paddingTop = bannerHeight ? `${bannerHeight + 85}px` : '75px';
        }
    };

    if (!CONFIG.IS_MAINNET) {
        return (
            <StyledNetworkBanner id='top-banner'>
                <Translate id='networkBanner.title' />
                <span className='network-link'>
                    (<a href={`${CONFIG.NODE_URL}/status`} target='_blank' rel='noopener noreferrer'>
                        {CONFIG.NODE_URL.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0]}
                    </a>)
                </span>
                {/* @ts-ignore */}
                <Tooltip translate='networkBanner.desc' modalOnly={true} />
            </StyledNetworkBanner>
        );
    }

    if (CONFIG.SHOW_PRERELEASE_WARNING) {
        return (
            <StyledNetworkBanner id='top-banner' className='staging-banner'>
                <AlertTriangleIcon color='var(--mnw-color-15)' />
                <Translate id='stagingBanner.title' />
                {/* @ts-ignore */}
                <Tooltip translate='stagingBanner.desc' modalOnly={true} />
            </StyledNetworkBanner>
        );
    }

    return null;
};

// @todo Remove when a global state interface will be ready
type TempState = {
    account: { [k: string]: any }
}

const mapStateToProps = (state: TempState) => ({
    account: state.account,
});

export default connect(mapStateToProps)(NetworkBanner);
