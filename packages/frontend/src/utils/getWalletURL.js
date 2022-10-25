import CONFIG from '../config';
import ENVIRONMENT from '../config/enviroment';
import { isWhitelabel } from '../config/whitelabel';

export const getNearOrgWalletUrl = (https = true) => {
    let networkName = '';

    if (CONFIG.SHOW_PRERELEASE_WARNING) {
        networkName = 'staging.';
    } else if (!CONFIG.IS_MAINNET) {
        networkName = 'testnet.';
    }

    return `${https ? 'https://' : ''}wallet.${networkName}near.org`;
};

export const getMyNearWalletUrl = (https = true) => {
    const prefix = {
        [ENVIRONMENT.TESTNET]: 'testnet.',
        [ENVIRONMENT.MAINNET]: 'app.',
        [ENVIRONMENT.DEVELOPMENT]: 'testnet.',
        [ENVIRONMENT.MAINNET_STAGING]: 'staging.'
    }[CONFIG.NEAR_WALLET_ENV];

    return `${https ? 'https://' : ''}${prefix || ''}mynearwallet.com`;
};

export const getMyNearWalletUrlFromNEARORG = (https = true) => {
    const prefix = {
        [ENVIRONMENT.TESTNET_NEARORG]: 'testnet.',
        [ENVIRONMENT.MAINNET_NEARORG]: 'app.',
        [ENVIRONMENT.DEVELOPMENT]: 'testnet.',
    }[CONFIG.NEAR_WALLET_ENV];

    return `${https ? 'https://' : ''}${prefix || ''}mynearwallet.com`;
};

export const getMeteorWalletUrl = () => {
    return 'https://wallet.meteorwallet.app';
};

export default isWhitelabel ? getMyNearWalletUrl : getNearOrgWalletUrl;
