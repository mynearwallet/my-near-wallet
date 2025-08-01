import * as nearApiJs from 'near-api-js';
import { parseNearAmount } from 'near-api-js/lib/utils/format';

export default {
    ACCOUNT_HELPER_URL: 'https://api3.nearblocks.io/v1/kitwallet',
    ACCOUNT_KITWALLET_HELPER_URL: 'https://helper.mainnet.near.org',
    ACCOUNT_ID_SUFFIX: 'near',
    ACCESS_KEY_FUNDING_AMOUNT: nearApiJs.utils.format.parseNearAmount('0.25'),
    BROWSER_MIXPANEL_TOKEN: '7c5730e5b3556a06b73829b3c3b40a86',
    DISABLE_CREATE_ACCOUNT: true,
    EXPLORE_APPS_URL: 'https://awesomenear.com/',
    EXPLORE_DEFI_URL: 'https://awesomenear.com/categories/defi/',
    EXPLORER_URL: 'https://nearblocks.io',
    GLEAP_FRONTEND_API_KEY: 'Pc07nwsDmsVoWYJJj9BgES87xE7RCW74',
    HIDE_SIGN_IN_WITH_LEDGER_ENTER_ACCOUNT_ID_MODAL: false,
    // INDEXER_SERVICE_URL: 'https://api.kitwallet.app',
    INDEXER_SERVICE_URL: 'https://api3.nearblocks.io/v1/kitwallet',
    INDEXER_FASTNEAR_SERVICE_URL: 'https://api.fastnear.com',
    INDEXER_NEARBLOCK_SERVICE_URL: 'https://api3.nearblocks.io',
    INDEXER_NEARBLOCK_EXPERIMENTAL_SERVICE_URL: 'https://api3.nearblocks.io',
    LINKDROP_GAS: '100000000000000',
    LOCKUP_ACCOUNT_ID_SUFFIX: 'lockup.near',
    MIN_BALANCE_FOR_GAS: nearApiJs.utils.format.parseNearAmount('0.05'),
    MIN_BALANCE_TO_CREATE: nearApiJs.utils.format.parseNearAmount('0.1'),
    MOONPAY_API_KEY: 'pk_live_jYDdkGL7bJsrwalHZs1lVIhdOHOtK8BR',
    MOONPAY_API_URL: 'https://api.moonpay.com',
    MOONPAY_BUY_URL: 'https://buy.moonpay.io?apiKey=',
    TRANSAK_API_KEY: '170f3c62-9cdd-412e-900c-e6b97330a6f0',
    TRANSAK_BUY_URL: 'https://global.transak.com/',
    UTORG_ORDER_URL: 'https://app.utorg.pro/direct/wallet.near.org/',
    MULTISIG_CONTRACT_HASHES: [
        // https://github.com/near/core-contracts/blob/fa3e2c6819ef790fdb1ec9eed6b4104cd13eb4b7/multisig/src/lib.rs
        '7GQStUCd8bmCK43bzD8PRh7sD2uyyeMJU5h8Rj3kXXJk',
        // https://github.com/near/core-contracts/blob/fb595e6ec09014d392e9874c2c5d6bbc910362c7/multisig/src/lib.rs
        'AEE3vt6S3pS2s7K6HXnZc46VyMyJcjygSMsaafFh67DF',
        // https://github.com/near/core-contracts/blob/636e7e43f1205f4d81431fad0be39c5cb65455f1/multisig/src/lib.rs
        '8DKTSceSbxVgh4ANXwqmRqGyPWCuZAR1fCqGPXUjD5nZ',
        // https://github.com/near/core-contracts/blob/f93c146d87a779a2063a30d2c1567701306fcae4/multisig/res/multisig.wasm
        '55E7imniT2uuYrECn17qJAk9fLcwQW4ftNSwmCJL5Di',
        // unknown
        'HRP7Qf2HDaXTD8EWs7G8siNNGxWWBCe1JaDxcM2cJmQR',
    ],
    MULTISIG_MIN_AMOUNT: '4',
    NETWORK_ID: 'default',
    NODE_URL: 'https://rpc.mainnet.near.org',
    NODE_ARCHIVAL_URL: 'https://archival-rpc.mainnet.pagoda.co',
    REACT_APP_USE_TESTINGLOCKUP: false,
    RECAPTCHA_CHALLENGE_API_KEY: '6LeRzswaAAAAAGeS7mSasZ1wDcGnMcH3D7W1gy1b',
    RECAPTCHA_ENTERPRISE_SITE_KEY: '6LcpJ3EcAAAAAFgA-nixKFNGWMo9IG9FQhH4XjSY',
    SENTRY_DSN:
        'https://15d0d1b94e8548dd9663b8c93bf4550a@o398573.ingest.sentry.io/5396205',
    SHOW_PRERELEASE_WARNING: false,
    SMS_BLACKLIST: ['CN', 'VN', 'TH'],
    STAKING_GAS_BASE: '25000000000000', // 25 Tgas
    WHITELISTED_CONTRACTS: [
        'berryclub.ek.near',
        'wrap.near',
        '6b175474e89094c44da98b954eedeac495271d0f.factory.bridge.near',
    ],
    NEAR_TOKEN_ID: 'wrap.near',
    FARMING_CLAIM_GAS: parseNearAmount('0.00000000015'),
    FARMING_CLAIM_YOCTO: '1',
    REF_FINANCE_API_ENDPOINT: 'https://api.ref.finance',
    REF_FINANCE_CONTRACT: 'v2.ref-finance.near',
    USN_CONTRACT: 'usn',
    USDT_CONTRACT: 'dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near',
    HAPI_PROTOCOL_ADDRESS: 'proxy.hapiprotocol.near',
    CALIMERO_URL: 'https://app.calimero.network',
};
