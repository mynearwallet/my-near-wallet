import BN from 'bn.js';
import * as nearApiJs from 'near-api-js';

import CONFIG from '../config';
import { wallet } from '../utils/wallet';

/**
 * The host half of the new-key transfer: sign and broadcast the AddKey that puts Meteor's freshly
 * minted public key onto each source account.
 *
 * This is the SDK's `IAddKeyJournalChain` seam. The SDK owns the crash-safe journal around it —
 * intent recorded before signing, exact signed bytes recorded before broadcast, rebroadcast of
 * those identical bytes when a result is ambiguous — and hands these methods nothing but the job's
 * PUBLIC identity. The source full-access key never reaches the SDK; it is resolved here, from
 * this wallet's own keystore.
 */

/** AddKey costs a storage deposit; refuse early rather than pay an on-chain failure to learn it. */
const MIN_ADD_KEY_BALANCE_YOCTO = new BN('2000000000000000000000');

/** near-api-js keeps `signTransaction` protected; this exposes it without broadcasting anything. */
class SignOnlyAccount extends nearApiJs.Account {
    async signAddKeyTransaction(destinationPublicKey) {
        // Full access, deliberately: Meteor must be able to act for this account exactly as this
        // wallet can — that is what transferring it means.
        return this.signTransaction(this.accountId, [
            nearApiJs.transactions.addKey(
                nearApiJs.utils.PublicKey.from(destinationPublicKey),
                nearApiJs.transactions.fullAccessKey()
            ),
        ]);
    }
}

/**
 * Resolve the job's source signer from this wallet's keystore, isolated to exactly one key.
 *
 * Fails closed on a mismatch: the locally stored key must equal the `sourcePublicKey` the job
 * names. Signing with any other key would authorize a destination key the transfer cannot prove,
 * and the failure would surface much later and far less clearly.
 */
const getExactSourceAccount = async (job) => {
    const keyPair = await wallet.getLocalKeyPair(job.accountId);
    if (keyPair == null || keyPair.getPublicKey().toString() !== job.sourcePublicKey) {
        throw new Error(
            `The exact source signing key for ${job.accountId} is no longer available in this wallet.`
        );
    }
    // A one-key keystore, not the wallet's: `findAccessKey` picks the signer's key, so this is
    // what guarantees the AddKey is signed by the source key the transfer was started with.
    const keyStore = new nearApiJs.keyStores.InMemoryKeyStore();
    await keyStore.setKey(CONFIG.NETWORK_ID, job.accountId, keyPair);
    const connection = nearApiJs.Connection.fromConfig({
        networkId: wallet.connection.networkId,
        provider: wallet.connection.provider,
        signer: new nearApiJs.InMemorySigner(keyStore),
    });
    return new SignOnlyAccount(connection, job.accountId);
};

const assertCanAffordAddKey = async (account, accountId) => {
    const { amount } = await account.state();
    if (new BN(amount).lt(MIN_ADD_KEY_BALANCE_YOCTO)) {
        throw new Error(
            `${accountId} does not have enough available NEAR to add Meteor's access key.`
        );
    }
};

/**
 * Remove a destination key from its account, signed by the EXACT source key that granted it.
 *
 * The recovery step behind `destination_key_present_unproven`: the key is on the account but
 * nothing binds it to a transfer, so it has to come off before the fenced record can be retired.
 * Deliberately routed through `getExactSourceAccount` rather than the wallet's default signer —
 * the same fail-closed key isolation the AddKey used, so a wallet that has since lost the source
 * key says so instead of removing the key with some other authority.
 */
export const removeDestinationKeyWithSourceSigner = async (operation) => {
    const account = await getExactSourceAccount(operation);
    return account.deleteKey(nearApiJs.utils.PublicKey.from(operation.destinationPublicKey));
};

/**
 * Whether an RPC rejection means "this transaction can never be accepted", as opposed to any other
 * failure. NEAR reports it as an `InvalidTxError::Expired` variant; the exact envelope differs
 * between RPC shapes, so this checks the serialized error for the marker rather than one path.
 */
const isExpiredTransactionError = (error) => {
    const serialized =
        error instanceof Error ? `${error.message}` : JSON.stringify(error ?? '');
    let detail = '';
    try {
        detail = JSON.stringify(error?.cause ?? error ?? '');
    } catch {
        detail = '';
    }
    return /\bExpired\b/.test(serialized) || /"Expired"/.test(detail);
};

export const createWalletAddKeyChain = () => ({
    getAccessKeys: (job) =>
        wallet.connection.provider.query({
            request_type: 'view_access_key_list',
            account_id: job.accountId,
            finality: 'final',
        }),

    signAddKeyTransaction: async (job) => {
        const account = await getExactSourceAccount(job);
        // Before signing, not after: a signed transaction is journaled as replayable bytes, and
        // there is no reason to create one that can only ever fail on-chain.
        await assertCanAffordAddKey(account, job.accountId);
        const [transactionHash, signed] = await account.signAddKeyTransaction(
            job.destinationPublicKey
        );
        return {
            transactionHash: nearApiJs.utils.serialize.base_encode(transactionHash),
            signedTransactionBase64: Buffer.from(signed.encode()).toString('base64'),
        };
    },

    // FINAL waits, both. Meteor proves the AddKey off THIS result and its verifier requires
    // `final_execution_status === "FINAL"` — so `broadcast_tx_commit` is the wrong call here: it
    // returns once the transaction is EXECUTED_OPTIMISTIC, which the proof reads as not-final and
    // rejects even though the key did land. A throw is read as AMBIGUOUS and reconciled by hash,
    // never retried with fresh bytes.
    broadcastSignedTransaction: (job, signed) =>
        wallet.connection.provider.sendJsonRpc('send_tx', {
            signed_tx_base64: signed.signedTransactionBase64,
            wait_until: 'FINAL',
        }),

    getFinalTransactionStatus: (job, transactionHash) =>
        wallet.connection.provider.sendJsonRpc('tx', {
            tx_hash: transactionHash,
            sender_account_id: job.accountId,
            wait_until: 'FINAL',
        }),

    /**
     * Whether these exact signed bytes can never be accepted any more.
     *
     * Only the reconciliation state machine calls this, and only to separate "has not landed yet"
     * from "can no longer land". Without a definitive answer the SDK stays `ambiguous` rather than
     * retiring a fenced operation that could still take effect — which is safe but leaves the
     * user stuck, so answering it is what makes recovery possible at all.
     *
     * The answer comes from the chain, not from a clock: re-submitting the identical bytes is
     * idempotent (if the transaction already landed the node says so, and it is the same
     * transaction hash either way), and NEAR reports a transaction whose block hash has fallen
     * outside the validity window as `Expired`. Anything else — including a network failure — is
     * reported as "not known to be dead".
     */
    isSignedTransactionExpired: async (job, signed) => {
        try {
            await wallet.connection.provider.sendJsonRpc('send_tx', {
                signed_tx_base64: signed.signedTransactionBase64,
                wait_until: 'EXECUTED_OPTIMISTIC',
            });
            // It was accepted. Whatever else is true, it is not expired.
            return false;
        } catch (error) {
            return isExpiredTransactionError(error);
        }
    },
});
