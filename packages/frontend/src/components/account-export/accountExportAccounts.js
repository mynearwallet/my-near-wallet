import CONFIG from '../../config';
import { getKeyMeta, wallet } from '../../utils/wallet';

export const MAX_EXPORTABLE_ACCOUNTS = 30;

export const loadExportableAccounts = async () => {
    const accountIds = await wallet.keyStore.getAccounts(CONFIG.NETWORK_ID);

    return Promise.all(
        accountIds.map(async (accountId) => {
            try {
                const keyPair = await wallet.getLocalKeyPair(accountId);
                if (keyPair == null) {
                    return { accountId, availability: 'no_local_key' };
                }
                const publicKey = keyPair.getPublicKey().toString();
                const keyMeta = await getKeyMeta(publicKey);
                if (keyMeta.type === 'ledger') {
                    return { accountId, availability: 'ledger_unsupported' };
                }
                if (!publicKey.startsWith('ed25519:')) {
                    return { accountId, availability: 'algorithm_unsupported' };
                }
                if (await wallet.hasTwoFactorEnabled(accountId)) {
                    return { accountId, availability: 'two_factor_unsupported' };
                }
                const hasFullAccessKey = await wallet.isFullAccessKey(accountId, keyPair);

                return {
                    accountId,
                    sourcePublicKey: publicKey,
                    availability: hasFullAccessKey ? 'available' : 'not_full_access',
                };
            } catch {
                return { accountId, availability: 'verification_failed' };
            }
        })
    );
};

export const loadNewKeyTransferAccounts = async (accountIds) => {
    const eligible = await loadExportableAccounts();
    const byId = new Map(eligible.map((account) => [account.accountId, account]));
    return Promise.all(
        accountIds.map(async (accountId) => {
            const account = byId.get(accountId);
            if (account?.availability !== 'available' || !account.sourcePublicKey) {
                // Carry the reason, not just the refusal: "not eligible" reads as a permanent
                // property of the account when the usual cause is a transient RPC failure the
                // user only has to retry.
                const error = new Error(
                    `${accountId} is not eligible for a new-key transfer.`
                );
                error.accountId = accountId;
                error.availability = account?.availability || 'verification_failed';
                throw error;
            }
            const keyPair = await wallet.getLocalKeyPair(accountId);
            if (keyPair == null || keyPair.getPublicKey().toString() !== account.sourcePublicKey) {
                throw new Error(`The selected source key for ${accountId} changed.`);
            }
            return { accountId, sourcePublicKey: account.sourcePublicKey, keyPair };
        })
    );
};

export const loadExportAccountSecrets = (accountIds) =>
    Promise.all(
        accountIds.map(async (accountId) => {
            const keyPair = await wallet.getLocalKeyPair(accountId);

            if (keyPair == null) {
                throw new Error(`No local key is available for ${accountId}.`);
            }

            return {
                accountId,
                privateKey: keyPair.toString(),
            };
        })
    );
