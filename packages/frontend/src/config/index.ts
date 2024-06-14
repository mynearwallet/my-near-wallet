import { ENearNetwork } from '@meteorwallet/meteor-near-sdk/dist/packages/common/core/modules/blockchains/near/core/types/near_basic_types';
import environmentConfig from './configFromEnvironment';
import ENVIRONMENT from './enviroment';
import development from './environmentDefaults/development';
import mainnet from './environmentDefaults/mainnet';
import mainnet_STAGING from './environmentDefaults/mainnet_STAGING';
import testnet from './environmentDefaults/testnet';
import testnet_STAGING from './environmentDefaults/testnet_STAGING';

const clearEmptyProps = <T>(config: T): T =>
    Object.entries(config).reduce<T>((cfg, [key, value]) => {
        if (typeof value !== 'undefined') {
            cfg[key] = value;
        }

        return cfg;
    }, {} as T);

const defaults = {
    [ENVIRONMENT.DEVELOPMENT]: development,
    [ENVIRONMENT.TESTNET]: testnet,
    [ENVIRONMENT.TESTNET_STAGING]: testnet_STAGING,
    [ENVIRONMENT.MAINNET]: mainnet,
    [ENVIRONMENT.MAINNET_STAGING]: mainnet_STAGING,
}[environmentConfig.NEAR_WALLET_ENV];

const NearNetworkMap = {
    [ENVIRONMENT.DEVELOPMENT]:
        environmentConfig.NEAR_WALLET_ENV as string as ENearNetwork,
    [ENVIRONMENT.MAINNET]: environmentConfig.NEAR_WALLET_ENV as string as ENearNetwork,
    [ENVIRONMENT.TESTNET]: environmentConfig.NEAR_WALLET_ENV as string as ENearNetwork,
    [ENVIRONMENT.MAINNET_STAGING]: ENearNetwork.mainnet,
    [ENVIRONMENT.TESTNET_STAGING]: ENearNetwork.testnet,
};
const CURRENT_NEAR_NETWORK: ENearNetwork =
    NearNetworkMap[environmentConfig.NEAR_WALLET_ENV];

const CONFIG = {
    CURRENT_NEAR_NETWORK,
    ...defaults,
    ...clearEmptyProps(environmentConfig),
};

export default CONFIG;
