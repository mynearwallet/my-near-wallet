import CONFIG from '../../config';
import { isImplicitAccount } from '../../utils/account';
import { getKeyMeta, wallet } from '../../utils/wallet';

export const MAX_EXPORTABLE_ACCOUNTS = 30;

/**
 * The RPC uses an error response for an implicit account that has not been funded and therefore
 * does not exist on-chain yet. That is a known account state, not a network failure.
 */
const isAccountDoesNotExistError = (error) =>
    /AccountDoesNotExist|does not exist while viewing/.test(
        [
            error?.type,
            error?.name,
            error?.message,
            error?.cause?.type,
            error?.cause?.name,
            error?.cause?.message,
        ]
            .filter(Boolean)
            .join(' ')
    );

const probeExportability = async (accountId) => {
    let sourcePublicKey;
    try {
        const keyPair = await wallet.getLocalKeyPair(accountId);
        if (keyPair == null) {
            return { accountId, availability: 'no_local_key' };
        }
        sourcePublicKey = keyPair.getPublicKey().toString();
        const keyMeta = await getKeyMeta(sourcePublicKey);
        if (keyMeta.type === 'ledger') {
            return {
                accountId,
                sourcePublicKey,
                availability: 'ledger_unsupported',
            };
        }
        if (!sourcePublicKey.startsWith('ed25519:')) {
            return {
                accountId,
                sourcePublicKey,
                availability: 'algorithm_unsupported',
            };
        }
        if (await wallet.hasTwoFactorEnabled(accountId)) {
            return {
                accountId,
                sourcePublicKey,
                availability: 'two_factor_unsupported',
            };
        }
        const hasFullAccessKey = await wallet.isFullAccessKey(accountId, keyPair);

        return {
            accountId,
            sourcePublicKey,
            availability: hasFullAccessKey ? 'available' : 'not_full_access',
        };
    } catch (error) {
        if (isImplicitAccount(accountId) && isAccountDoesNotExistError(error)) {
            return {
                accountId,
                ...(sourcePublicKey ? { sourcePublicKey } : {}),
                availability: 'not_funded',
            };
        }
        if (error instanceof Error && sourcePublicKey != null) {
            error.sourcePublicKey = sourcePublicKey;
        }
        throw error;
    }
};

/** How long to wait before the single probe retry — enough for a rate-limit burst to drain. */
const PROBE_RETRY_DELAY_MILLIS = 800;

export const loadExportableAccounts = async () => {
    const accountIds = await wallet.keyStore.getAccounts(CONFIG.NETWORK_ID);

    return Promise.all(
        accountIds.map(async (accountId) => {
            try {
                return await probeExportability(accountId);
            } catch {
                // One retry before giving up: the probe fires several RPC reads per account (and
                // the flows that lead here — a cancel above all — burst their own), so a single
                // failed read is far more often rate limiting than anything about the account.
                // Rendering that as "cannot be transferred" scared users about their keys.
                await new Promise((resolve) =>
                    setTimeout(resolve, PROBE_RETRY_DELAY_MILLIS)
                );
            }
            try {
                return await probeExportability(accountId);
            } catch (error) {
                return {
                    accountId,
                    ...(error?.sourcePublicKey
                        ? { sourcePublicKey: error.sourcePublicKey }
                        : {}),
                    availability: 'verification_failed',
                };
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
            if (
                keyPair == null ||
                keyPair.getPublicKey().toString() !== account.sourcePublicKey
            ) {
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
                publicKey: keyPair.getPublicKey().toString(),
                privateKey: keyPair.toString(),
            };
        })
    );
