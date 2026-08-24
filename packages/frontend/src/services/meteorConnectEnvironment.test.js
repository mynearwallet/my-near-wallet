import { resolveMeteorConnectEnvironment } from './meteorConnectEnvironment';

/**
 * The regression this guards: a staging deployment that asked for the DEV Meteor wallet while
 * dialling the PRODUCTION bridge. The bridge issues the link that opens the wallet, so the two
 * must come from one decision — and that decision must not depend on the build mode, because a
 * staging bundle is built with `NODE_ENV=production` exactly like a real production one.
 */
describe('resolveMeteorConnectEnvironment', () => {
    it('puts testnet on the development bridge and mainnet on production', () => {
        expect(resolveMeteorConnectEnvironment('testnet')).toBe('development');
        expect(resolveMeteorConnectEnvironment('mainnet')).toBe('production');
    });

    it('fails safe to development for anything that is not exactly mainnet', () => {
        // `meteorNetworkId` already narrows to one of the two, so this is belt and braces: an
        // unexpected value must never be read as "mainnet" and routed to the production bridge
        // with real key material.
        for (const value of ['', 'Mainnet', 'MAINNET', 'localnet', undefined, null]) {
            expect(resolveMeteorConnectEnvironment(value)).toBe('development');
        }
    });

    /**
     * The deployed environments, resolved the way `config/index.ts` resolves them:
     * `NearNetworkMap` maps `testnet_STAGING → testnet` and `mainnet_STAGING → mainnet`, and
     * `meteorNetworkId` is `CURRENT_NEAR_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'`.
     */
    it('routes each deployed NEAR_WALLET_ENV to the intended bridge', () => {
        const nearNetworkByWalletEnv = {
            development: 'testnet',
            testnet: 'testnet',
            testnet_STAGING: 'testnet',
            mainnet: 'mainnet',
            mainnet_STAGING: 'mainnet',
        };
        const environmentByWalletEnv = Object.fromEntries(
            Object.entries(nearNetworkByWalletEnv).map(([walletEnv, network]) => [
                walletEnv,
                resolveMeteorConnectEnvironment(network),
            ])
        );

        expect(environmentByWalletEnv).toEqual({
            development: 'development',
            testnet: 'development',
            // The deployment this unblocks: testnet staging must reach the development bridge.
            testnet_STAGING: 'development',
            mainnet: 'production',
            mainnet_STAGING: 'production',
        });
    });
});
