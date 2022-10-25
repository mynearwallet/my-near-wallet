import environmentConfig from './configFromEnvironment';
import ENVIRONMENT from './enviroment';
import development from './environmentDefaults/development';
import mainnet from './environmentDefaults/mainnet';
import mainnet_STAGING from './environmentDefaults/mainnet_STAGING';
import testnet from './environmentDefaults/testnet';
import testnet_STAGING from './environmentDefaults/testnet_STAGING';

const defaults = {
    [ENVIRONMENT.DEVELOPMENT]: development,
    [ENVIRONMENT.TESTNET]: testnet,
    [ENVIRONMENT.TESTNET_STAGING]: testnet_STAGING,
    [ENVIRONMENT.MAINNET]: mainnet,
    [ENVIRONMENT.MAINNET_STAGING]: mainnet_STAGING,
}[environmentConfig.NEAR_WALLET_ENV];

const CONFIG = {
    ...defaults,
    ...environmentConfig
};

export default CONFIG;
