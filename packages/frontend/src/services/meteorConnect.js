import { EMeteorAppId, MeteorConnect, webpage_local_storage } from '@meteorwallet/sdk';
import CONFIG from '../config';

export const meteorNetworkId =
    CONFIG.CURRENT_NEAR_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
const isTestnet = meteorNetworkId === 'testnet';
const meteorConnect = new MeteorConnect();

let initializePromise;

const getPartnerMetadata = () => ({
    name: 'My NEAR Wallet',
    description: 'Export your selected NEAR accounts to Meteor Wallet.',
    iconUrl: `${window.location.origin}/favicon.svg`,
    originUrl: window.location.origin,
});

const getLocalBridgeConfig = () =>
    window.location.hostname === 'localhost'
        ? { backendUrl: 'http://localhost:8787' }
        : {};

const initializeMeteorConnect = () => {
    initializePromise ??= meteorConnect
        .initialize({
            storage: webpage_local_storage,
            mobileBridge: {
                enabled: true,
                ...getLocalBridgeConfig(),
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
