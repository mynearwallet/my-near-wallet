import { EMeteorAppId, MeteorConnect, webpage_local_storage } from '@meteorwallet/sdk';
import CONFIG from '../config';

export const meteorNetworkId =
    CONFIG.CURRENT_NEAR_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
const isTestnet = meteorNetworkId === 'testnet';
const meteorConnect = new MeteorConnect();

const LIVE_BRIDGE_BACKEND_URL = 'https://mc.meteorwallet.app';

let initializePromise;

const getPartnerMetadata = () => {
    const origin = window.location.origin;
    return {
        name: 'My NEAR Wallet',
        description: 'Export your selected NEAR accounts to Meteor Wallet.',
        // The bridge backend only accepts https icon URLs — omit the icon on http dev origins.
        ...(origin.startsWith('https://') ? { iconUrl: `${origin}/favicon.svg` } : {}),
        originUrl: origin,
    };
};

/**
 * Same convention as the Meteor Wallet web frontend: always use the live bridge backend —
 * including local dev — so dev runs exercise the real infrastructure. Development builds may
 * override it for local-backend testing with an explicit `?mcBackend=<url>` query param
 * (`?mcBackend=local` is shorthand for the local wrangler backend on :8787). Production builds
 * ignore the param entirely: a link must never choose the backend in production.
 */
const resolveBridgeBackendUrl = () => {
    if (!CONFIG.IS_DEVELOPMENT || typeof window === 'undefined') {
        return LIVE_BRIDGE_BACKEND_URL;
    }
    const requested = new URL(window.location.href).searchParams.get('mcBackend');
    if (requested == null) {
        return LIVE_BRIDGE_BACKEND_URL;
    }
    const backendUrl = requested === 'local' ? 'http://localhost:8787' : requested;
    try {
        const url = new URL(backendUrl);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return LIVE_BRIDGE_BACKEND_URL;
        }
        // eslint-disable-next-line no-console
        console.info(`[MeteorConnect] dev backend override via ?mcBackend= → ${backendUrl}`);
        return backendUrl;
    } catch {
        return LIVE_BRIDGE_BACKEND_URL;
    }
};

const initializeMeteorConnect = () => {
    initializePromise ??= meteorConnect
        .initialize({
            storage: webpage_local_storage,
            mobileBridge: {
                enabled: true,
                backendUrl: resolveBridgeBackendUrl(),
                meteorAppId: isTestnet
                    ? EMeteorAppId.meteor_wallet_mobile_dev
                    : EMeteorAppId.meteor_wallet_mobile,
                partnerMetadata: getPartnerMetadata(),
                transferAccounts: {
                    enabled: true,
                },
            },
        })
        .catch((error) => {
            initializePromise = undefined;
            throw error;
        });

    return initializePromise;
};

export const promptMeteorAccountTransfer = async ({ accounts, networkId }) => {
    await initializeMeteorConnect();

    await meteorConnect.transferAccounts.clearStaged();

    try {
        for (const account of accounts) {
            const stageResult = await meteorConnect.transferAccounts.stage({
                networkId,
                accountId: account.accountId,
                secretInput: account.privateKey,
            });

            if (!stageResult.ok) {
                throw new Error(
                    `Could not prepare ${account.accountId} for export: ${stageResult.message}`
                );
            }
        }

        return await meteorConnect.transferAccounts.prompt();
    } finally {
        await meteorConnect.transferAccounts.clearStaged();
    }
};
