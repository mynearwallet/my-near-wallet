import assert from 'assert';

import { parseNearAmount } from 'near-api-js/lib/utils/format';

import ENVIRONMENT from './enviroment';
import {
    envValIsSet,
    parseBooleanFromShell,
    parseCommaSeperatedStringAsArrayFromShell
} from './envParsers';

const NEAR_WALLET_ENV = process.env.NEAR_WALLET_ENV as ENVIRONMENT;

assert(
    Object.values(ENVIRONMENT).some((env) => NEAR_WALLET_ENV === env),
    `Invalid environment: "${NEAR_WALLET_ENV}"`
);

export default {
    ACCOUNT_HELPER_URL: process.env.REACT_APP_ACCOUNT_HELPER_URL,
    ACCOUNT_ID_SUFFIX: process.env.REACT_APP_ACCOUNT_ID_SUFFIX,
    ACCESS_KEY_FUNDING_AMOUNT: process.env.REACT_APP_ACCESS_KEY_FUNDING_AMOUNT,
    BROWSER_MIXPANEL_TOKEN: process.env.BROWSER_MIXPANEL_TOKEN,
    DISABLE_CREATE_ACCOUNT: parseBooleanFromShell(
        process.env.DISABLE_CREATE_ACCOUNT
    ),
    EXPLORE_APPS_URL: process.env.EXPLORE_APPS_URL,
    EXPLORE_DEFI_URL: process.env.EXPLORE_DEFI_URL,
    EXPLORER_URL: process.env.EXPLORER_URL,
    GLEAP_FRONTEND_API_KEY: process.env.GLEAP_FRONTEND_API_KEY,
    HIDE_SIGN_IN_WITH_LEDGER_ENTER_ACCOUNT_ID_MODAL: parseBooleanFromShell(
        process.env.HIDE_SIGN_IN_WITH_LEDGER_ENTER_ACCOUNT_ID_MODAL
    ),
    IS_MAINNET: [
        ENVIRONMENT.MAINNET,
        ENVIRONMENT.MAINNET_STAGING,
    ].some((env) => env === NEAR_WALLET_ENV),
    LINKDROP_GAS: process.env.LINKDROP_GAS,
    TOKEN_TRANSFER_DEPOSIT: process.env.TOKEN_TRANSFER_DEPOSIT || '1',
    FT_TRANSFER_GAS: process.env.FT_TRANSFER_GAS || '15000000000000',
    FT_STORAGE_DEPOSIT_GAS: process.env.FT_STORAGE_DEPOSIT_GAS || '30000000000000',
    FT_MINIMUM_STORAGE_BALANCE: process.env.FT_MINIMUM_STORAGE_BALANCE || '1250000000000000000000',
    FT_MINIMUM_STORAGE_BALANCE_LARGE: process.env.FT_MINIMUM_STORAGE_BALANCE_LARGE || '12500000000000000000000',
    FT_REGISTRATION_DEPOSIT: process.env.FT_REGISTRATION_DEPOSIT || '365000000000000000000',
    FT_REGISTRATION_DEPOSIT_GAS: process.env.FT_REGISTRATION_DEPOSIT_GAS || '10000000000000',
    SEND_NEAR_GAS: process.env.SEND_NEAR_GAS || '450000000000',
    NFT_TRANSFER_GAS: process.env.NFT_TRANSFER_GAS || '100000000000000',
    LOCKUP_ACCOUNT_ID_SUFFIX: process.env.LOCKUP_ACCOUNT_ID_SUFFIX,
    MIN_BALANCE_FOR_GAS: process.env.REACT_APP_MIN_BALANCE_FOR_GAS,
    MIN_BALANCE_TO_CREATE: process.env.MIN_BALANCE_TO_CREATE,
    MOONPAY_API_KEY: process.env.MOONPAY_API_KEY,
    MOONPAY_API_URL: process.env.MOONPAY_API_URL,
    MOONPAY_BUY_URL: process.env.MOONPAY_BUY_URL,
    UTORG_ORDER_URL: process.env.UTORG_ORDER_URL,
    MULTISIG_CONTRACT_HASHES: parseCommaSeperatedStringAsArrayFromShell(
        process.env.MULTISIG_CONTRACT_HASHES
    ),
    MULTISIG_MIN_AMOUNT: process.env.REACT_APP_MULTISIG_MIN_AMOUNT,
    NEAR_WALLET_ENV,
    NETWORK_ID: process.env.REACT_APP_NETWORK_ID,
    NODE_URL: process.env.REACT_APP_NODE_URL,
    PUBLIC_URL: process.env.PUBLIC_URL,
    REACT_APP_USE_TESTINGLOCKUP: parseBooleanFromShell(
        process.env.REACT_APP_USE_TESTINGLOCKUP
    ),
    RECAPTCHA_CHALLENGE_API_KEY: process.env.RECAPTCHA_CHALLENGE_API_KEY,
    RECAPTCHA_ENTERPRISE_SITE_KEY: process.env.RECAPTCHA_ENTERPRISE_SITE_KEY,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_RELEASE: process.env.SENTRY_RELEASE
        ? parseBooleanFromShell(process.env.RENDER)
            ? `render:${process.env.RENDER_SERVICE_NAME}:${process.env.RENDER_GIT_BRANCH}:${process.env.RENDER_GIT_COMMIT}`
            : undefined
        : undefined,
    SHOW_PRERELEASE_WARNING: parseBooleanFromShell(
        process.env.SHOW_PRERELEASE_WARNING
    ),
    SMS_BLACKLIST: envValIsSet(process.env.SMS_BLACKLIST) ? parseCommaSeperatedStringAsArrayFromShell(
        process.env.SMS_BLACKLIST.replace(/\s/g, '')
    ) : undefined,
    STAKING_GAS_BASE: process.env.REACT_APP_STAKING_GAS_BASE,
    WHITELISTED_CONTRACTS: parseCommaSeperatedStringAsArrayFromShell(
        process.env.TOKEN_CONTRACTS
    ),
    NEAR_ID: process.env.NEAR_ID || 'NEAR',
    NEAR_DECIMALS: 24,
    TEMPLATE_ACCOUNT_ID: process.env.TEMPLATE_ACCOUNT_ID || 'dontcare',
    FARMING_CLAIM_GAS: process.env.FARMING_CLAIM_GAS || parseNearAmount('0.00000000015'),
    FARMING_CLAIM_YOCTO: process.env.FARMING_CLAIM_YOCTO || '1',
    REF_FINANCE_API_ENDPOINT: process.env.REF_FINANCE_API_ENDPOINT,
    REF_FINANCE_CONTRACT: process.env.REF_FINANCE_CONTRACT,
    HAPI_PROTOCOL_ADDRESS: process.env.HAPI_PROTOCOL_ADDRESS
};
