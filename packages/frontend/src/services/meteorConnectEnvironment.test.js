import {
    resolveMeteorConnectEnvironment,
    resolveMeteorWalletWebUrl,
} from './meteorConnectEnvironment';

/**
 * The regressions this guards, in both directions:
 *
 * 1. A staging deployment must never dial the PRODUCTION bridge. Mainnet staging did exactly that
 *    while the mapping followed the NEAR network, and every transfer died on the bridge answer
 *    (`session_disabled`, or a handshake refusal from an older production build) with the reason
 *    invisible from the page.
 * 2. Only the real production mainnet build may reach the production bridge — an unexpected value
 *    must fail safe to development, never be read as production.
 *
 * The bridge issues the link that opens the Meteor wallet, so backend and wallet app id must come
 * from this one decision — and that decision must not depend on the build mode, because a staging
 * bundle is built with `NODE_ENV=production` exactly like a real production one.
 */
describe('resolveMeteorConnectEnvironment', () => {
    it('routes each deployed NEAR_WALLET_ENV to the intended bridge', () => {
        expect(resolveMeteorConnectEnvironment('mainnet')).toBe('production');

        // Every staging deployment — mainnet staging included — belongs to the development
        // bridge, and in turn to the dev Meteor wallet (wallet-dev.meteorwallet.app).
        for (const walletEnv of [
            'development',
            'testnet',
            'testnet_STAGING',
            'mainnet_STAGING',
        ]) {
            expect(resolveMeteorConnectEnvironment(walletEnv)).toBe('development');
        }
    });

    it('fails safe to development for anything that is not exactly the production build', () => {
        // `NEAR_WALLET_ENV` is validated against the deployment enum at startup, so this is belt
        // and braces: an unexpected value must never be routed to the production bridge.
        for (const value of [
            '',
            'Mainnet',
            'MAINNET',
            'mainnet ',
            'localnet',
            undefined,
            null,
        ]) {
            expect(resolveMeteorConnectEnvironment(value)).toBe('development');
        }
    });

    it('opens production Meteor from the app and testnet MyNearWallet hosts', () => {
        for (const hostname of ['app.mynearwallet.com', 'testnet.mynearwallet.com']) {
            expect(resolveMeteorWalletWebUrl(hostname)).toBe(
                'https://wallet.meteorwallet.app/'
            );
        }

        for (const hostname of [
            'staging.mynearwallet.com',
            'mainnet-staging.mynearwallet.com',
            'localhost',
            'app.mynearwallet.com.evil.example',
            'testnet.mynearwallet.com.evil.example',
            '',
            undefined,
        ]) {
            expect(resolveMeteorWalletWebUrl(hostname)).toBe(
                'https://wallet-dev.meteorwallet.app/'
            );
        }
    });
});
