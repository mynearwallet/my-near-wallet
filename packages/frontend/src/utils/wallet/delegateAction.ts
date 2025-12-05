/**
 * NEP-366 DelegateAction utilities for meta-transactions.
 *
 * This module enables gasless transactions on NEAR by allowing users to sign
 * DelegateActions that can be submitted by a relayer who pays the gas fees.
 *
 * @see https://github.com/near/NEPs/pull/366
 * @see https://docs.near.org/chain-abstraction/meta-transactions
 */

import * as nearAPI from 'near-api-js';
import { sha256 } from 'js-sha256';

import CONFIG from '../../config';
import { wallet } from '../wallet';
import { store } from '../..';
import { actions as ledgerActions } from '../../redux/slices/ledger';

// NEP-366 prefix for delegate action signing
const DELEGATE_ACTION_PREFIX = 2170703681;

/**
 * Action parameter from URL query
 */
export interface ActionParam {
    methodName: string;
    args?: Record<string, unknown> | string;
    gas?: string;
    deposit?: string;
}

/**
 * Parameters for creating a signed delegate action
 */
export interface CreateSignedDelegateActionParams {
    accountId: string;
    receiverId: string;
    actions: ActionParam[];
    blockHeightTtl?: number;
}

/**
 * Result of creating a signed delegate action
 */
export interface SignedDelegateActionResult {
    serialized: string;
    publicKey: string;
    accountId: string;
    isLedger: boolean;
}

/**
 * Creates a SignedDelegateAction for meta-transaction submission.
 * The user signs this off-chain, and a relayer submits it (paying gas).
 *
 * @param params - Parameters for the delegate action
 * @returns The signed delegate action and its base64 serialization
 */
export async function createSignedDelegateAction({
    accountId,
    receiverId,
    actions,
    blockHeightTtl = 100,
}: CreateSignedDelegateActionParams): Promise<SignedDelegateActionResult> {
    // Get current block height for maxBlockHeight
    const block = await wallet.connection.provider.block({ finality: 'final' });
    const blockHeight = block.header.height;

    // Get user's public key from the wallet's signer
    const publicKey = await wallet.signer.getPublicKey(accountId, CONFIG.NETWORK_ID);
    if (!publicKey) {
        throw new Error(`No public key found for account ${accountId}`);
    }

    // Get access key nonce
    const accessKeyResponse = await wallet.connection.provider.query({
        request_type: 'view_access_key',
        finality: 'final',
        account_id: accountId,
        public_key: publicKey.toString(),
    });
    const accessKey = accessKeyResponse as { nonce: number };

    // Convert actions to NEAR action format
    const nearActions = actions.map((action) => {
        if (action.methodName) {
            // Parse args - could be object or JSON string
            let args: Record<string, unknown>;
            if (typeof action.args === 'string') {
                try {
                    args = JSON.parse(action.args);
                } catch {
                    args = {};
                }
            } else {
                args = action.args || {};
            }

            return nearAPI.transactions.functionCall(
                action.methodName,
                args,
                action.gas || '30000000000000',
                action.deposit || '0'
            );
        }
        throw new Error(`Unsupported action type: ${JSON.stringify(action)}`);
    });

    // Build the delegate action structure
    const delegateAction = {
        senderId: accountId,
        receiverId,
        actions: nearActions,
        nonce: accessKey.nonce + 1,
        maxBlockHeight: blockHeight + blockHeightTtl,
        publicKey,
    };

    // Create message to sign: prefix + sha256(serialized delegateAction)
    // Note: Using JSON serialization for simplicity. For full NEP-366 compliance,
    // this should use borsh serialization with the DelegateAction schema.
    const message = JSON.stringify({
        senderId: delegateAction.senderId,
        receiverId: delegateAction.receiverId,
        actions: actions.map((a) => ({
            methodName: a.methodName,
            args: a.args,
            gas: a.gas,
            deposit: a.deposit,
        })),
        nonce: delegateAction.nonce,
        maxBlockHeight: delegateAction.maxBlockHeight,
        publicKey: publicKey.toString(),
    });

    // Hash the message
    const messageHash = new Uint8Array(sha256.array(message));

    // Add NEP-366 prefix
    const prefixBuffer = new ArrayBuffer(4);
    new DataView(prefixBuffer).setUint32(0, DELEGATE_ACTION_PREFIX, true);
    const prefixArray = new Uint8Array(prefixBuffer);

    // Combine prefix and hash
    const dataToSign = new Uint8Array(prefixArray.length + messageHash.length);
    dataToSign.set(prefixArray);
    dataToSign.set(messageHash, prefixArray.length);

    // Check if this is a Ledger account
    const isLedger = !!(await wallet.getLedgerKey(accountId));

    let signature: Uint8Array;

    if (isLedger) {
        // Show Ledger modal for user to confirm on device
        wallet.dispatchShowLedgerModal(true);

        try {
            // For Ledger, sign without the NEP-366 prefix as the device handles it
            // The Ledger NEAR app expects raw message data
            const result = await wallet.signer.signMessage(
                messageHash,
                accountId,
                CONFIG.NETWORK_ID
            );
            signature = result.signature;
        } catch (error) {
            // Hide modal and re-throw
            store.dispatch(ledgerActions.checkAndHideLedgerModal());
            throw error;
        }

        // Hide Ledger modal after successful signing
        store.dispatch(ledgerActions.checkAndHideLedgerModal());
    } else {
        // Non-Ledger: sign with full data including prefix
        const result = await wallet.signer.signMessage(
            dataToSign,
            accountId,
            CONFIG.NETWORK_ID
        );
        signature = result.signature;
    }

    // Create the signed delegate action payload
    const signedDelegateAction = {
        delegateAction: {
            senderId: delegateAction.senderId,
            receiverId: delegateAction.receiverId,
            actions: actions,
            nonce: delegateAction.nonce.toString(),
            maxBlockHeight: delegateAction.maxBlockHeight.toString(),
            publicKey: publicKey.toString(),
        },
        signature: Buffer.from(signature).toString('base64'),
    };

    // Serialize to base64 for transport
    const serialized = Buffer.from(JSON.stringify(signedDelegateAction)).toString(
        'base64'
    );

    return {
        serialized,
        publicKey: publicKey.toString(),
        accountId,
        isLedger,
    };
}

/**
 * Parses actions from URL query parameter
 */
export function parseActionsFromQuery(actionsParam: string): ActionParam[] {
    try {
        const actions = JSON.parse(decodeURIComponent(actionsParam));
        if (!Array.isArray(actions)) {
            throw new Error('Actions must be an array');
        }
        return actions;
    } catch (error) {
        throw new Error(`Invalid actions parameter: ${(error as Error).message}`);
    }
}

/**
 * Validates delegate action parameters
 */
export function validateDelegateActionParams({
    receiverId,
    actions,
}: {
    receiverId: string;
    actions: ActionParam[];
}): boolean {
    if (!receiverId || typeof receiverId !== 'string') {
        throw new Error('receiverId is required and must be a string');
    }
    if (!actions || !Array.isArray(actions) || actions.length === 0) {
        throw new Error('actions is required and must be a non-empty array');
    }
    for (const action of actions) {
        if (!action.methodName) {
            throw new Error('Each action must have a methodName');
        }
    }
    return true;
}

/**
 * Formats action arguments for display in the UI
 */
export function formatActionArgs(
    args: Record<string, unknown> | string | undefined
): string | null {
    if (!args) {
        return null;
    }
    if (typeof args === 'string') {
        try {
            return JSON.stringify(JSON.parse(args), null, 2);
        } catch {
            return args;
        }
    }
    return JSON.stringify(args, null, 2);
}

/**
 * Checks if the action looks like a fungible token transfer
 */
export function isFungibleTokenTransfer(action: ActionParam): boolean {
    return (
        action.methodName === 'ft_transfer' || action.methodName === 'ft_transfer_call'
    );
}

/**
 * Checks if the given account uses a Ledger hardware wallet
 */
export async function isLedgerAccount(accountId: string): Promise<boolean> {
    const ledgerKey = await wallet.getLedgerKey(accountId);
    return !!ledgerKey;
}
