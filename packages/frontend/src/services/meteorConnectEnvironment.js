/**
 * Which Meteor Connect environment a given MyNearWallet deployment belongs to.
 *
 * Deliberately dependency-free — no SDK import, no config import — so it can be unit-tested
 * without initializing the wallet, in the same spirit as `newKeyTransferState.js`.
 *
 * This exists as its own decision because it was previously TWO decisions that could disagree:
 * the Meteor wallet app id followed the NEAR network, while the bridge backend followed the build
 * mode (`NODE_ENV`). The bridge issues the link that opens the Meteor wallet, so a session
 * created on one environment can only ever be claimed by the wallet of that same environment.
 * One input, one answer, both sides derived from it.
 *
 * Since 2026-08-27 the input is the DEPLOYED environment (`NEAR_WALLET_ENV`), not the NEAR
 * network: every staging deployment — mainnet staging included — belongs to the development
 * bridge and therefore links to the dev Meteor wallet (wallet-dev.meteorwallet.app), so staging
 * exercises the whole transfer flow without depending on the production rollout state. Only the
 * real production mainnet build (app.mynearwallet.com) dials the production bridge. The trade-off
 * is deliberate and accepted: mainnet staging sends real mainnet key material through the
 * development bridge, which is our own deployed backend.
 */

/** @typedef {'development' | 'production'} TMeteorConnectEnvironment */

/**
 * @param {string} nearWalletEnv The deployed environment this build was made for
 *   (`CONFIG.NEAR_WALLET_ENV`): one of `development`, `testnet`, `testnet_STAGING`, `mainnet`,
 *   `mainnet_STAGING`.
 * @returns {TMeteorConnectEnvironment}
 */
export const resolveMeteorConnectEnvironment = (nearWalletEnv) =>
    nearWalletEnv === 'mainnet' ? 'production' : 'development';

/** Production MyNearWallet is the only host that sends users to production Meteor Wallet. */
export const resolveMeteorWalletWebUrl = (hostname) =>
    hostname === 'app.mynearwallet.com' || hostname === 'testnet.mynearwallet.com'
        ? 'https://wallet.meteorwallet.app/'
        : 'https://wallet-dev.meteorwallet.app/';
