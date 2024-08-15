import configFromEnvironment from '../../config/configFromEnvironment';

export const METAPOOL_CONTRACT_ID = configFromEnvironment.IS_MAINNET
    ? 'meta-pool.near'
    : 'meta-v2.pool.testnet';
export const METAPOOL_STAKING_GAS = '50000000000000';
export const METAPOOL_SAFE_MINIMUM_MULTIPLIER = '0.99999';
