/**
 * Which Meteor Connect environment a given NEAR network belongs to.
 *
 * Deliberately dependency-free — no SDK import, no config import — so it can be unit-tested
 * without initializing the wallet, in the same spirit as `newKeyTransferState.js`.
 *
 * This exists as its own decision because it was previously TWO decisions that could disagree:
 * the Meteor wallet app id followed the NEAR network, while the bridge backend followed the build
 * mode (`NODE_ENV`). A staging build is bundled with `NODE_ENV=production`, so it asked for the
 * DEV Meteor wallet over the PRODUCTION bridge — and the production bridge refuses new sessions
 * with a non-retryable `session_disabled` (503) until the rollout gate opens.
 *
 * The bridge issues the link that opens the Meteor wallet, so a session created on one
 * environment can only ever be claimed by the wallet of that same environment. One input, one
 * answer, both sides derived from it.
 */

/** @typedef {'development' | 'production'} TMeteorConnectEnvironment */

/**
 * @param {string} networkId The NEAR network this build targets (`CONFIG.CURRENT_NEAR_NETWORK`).
 * @returns {TMeteorConnectEnvironment}
 */
export const resolveMeteorConnectEnvironment = (networkId) =>
    networkId === 'mainnet' ? 'production' : 'development';
