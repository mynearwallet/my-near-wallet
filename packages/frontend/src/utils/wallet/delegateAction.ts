/**
 * NEP-366 DelegateAction utilities for meta-transactions.
 *
 * This module enables gasless transactions on NEAR by allowing users to sign
 * DelegateActions that can be submitted by a relayer who pays the gas fees.
 *
 * Uses @near-js/transactions for NEP-366 compliant Borsh serialization.
 *
 * @see https://github.com/near/NEPs/pull/366
 * @see https://docs.near.org/chain-abstraction/meta-transactions
 */

import {
    buildDelegateAction,
    encodeDelegateAction,
    encodeSignedDelegate,
    SCHEMA,
    DelegateAction,
    SignedDelegate,
    actionCreators,
    Signature,
} from '@near-js/transactions';
import { PublicKey } from '@near-js/crypto';
// near-api-js re-exports borsh 0.7, which is what @near-js/transactions' SCHEMA is built
// for. The top-level borsh dependency is 1.0.0 (used by signMessage.ts) and its schema
// format is incompatible with that SCHEMA.
import { utils as nearUtils } from 'near-api-js';

import CONFIG from '../../config';
import { wallet } from '../wallet';

// NEP-366 signing prefix for DelegateAction: (2^30 + 366) = 1073742190, serialized as a u32
// little-endian. encodeDelegateAction() from @near-js/transactions prepends exactly these 4
// bytes, so keeping the constant lets us sign the dapp's original Borsh bytes without
// re-encoding them. Verified: prefix ++ receivedBytes === encodeDelegateAction(decoded).
export const NEP366_DELEGATE_ACTION_PREFIX = Buffer.from([0x6e, 0x01, 0x00, 0x40]);

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
}

/**
 * Creates a SignedDelegateAction for meta-transaction submission.
 * The user signs this off-chain, and a relayer submits it (paying gas).
 *
 * @param params - Parameters for the delegate action
 * @returns The signed delegate action and its base64 serialization (Borsh format)
 */
export async function createSignedDelegateAction({
    accountId,
    receiverId,
    actions,
    blockHeightTtl = 1000, // ~17 minutes at 1 block/sec
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

    // Validate nonce from access key response
    if (typeof accessKey.nonce !== 'number' || isNaN(accessKey.nonce)) {
        throw new Error('Invalid nonce from access key query');
    }

    // Convert actions to NEAR action format using actionCreators
    const nearActions = actions.map((action) => {
        if (action.methodName) {
            // Parse args - could be object or JSON string
            let args: Record<string, unknown>;
            if (typeof action.args === 'string') {
                try {
                    args = JSON.parse(action.args);
                } catch (e) {
                    throw new Error(
                        `Invalid JSON in action args for ${action.methodName}: ${action.args}`
                    );
                }
            } else {
                args = action.args || {};
            }

            return actionCreators.functionCall(
                action.methodName,
                args,
                BigInt(action.gas ?? '30000000000000'),
                BigInt(action.deposit ?? '0')
            );
        }
        throw new Error(`Unsupported action type: ${JSON.stringify(action)}`);
    });

    const nonce = BigInt(accessKey.nonce + 1);
    const maxBlockHeight = BigInt(blockHeight + blockHeightTtl);

    // Convert near-api-js PublicKey to @near-js/crypto PublicKey
    const cryptoPublicKey = PublicKey.fromString(publicKey.toString());

    // Build DelegateAction using @near-js/transactions
    const delegateAction = buildDelegateAction({
        actions: nearActions,
        maxBlockHeight,
        nonce,
        publicKey: cryptoPublicKey,
        receiverId,
        senderId: accountId,
    });

    // Encode the DelegateAction with NEP-366 prefix using @near-js/transactions
    const dataToSign = encodeDelegateAction(delegateAction);

    // Ledger is not supported yet for delegate actions: the NEP-366 preimage would be sent
    // over the Ledger transaction instruction (INS=2), which expects a Borsh Transaction, so
    // the device would either fail to parse it or sign the wrong preimage. Refuse explicitly
    // until this path is verified against a real device.
    if (await wallet.getLedgerKey(accountId)) {
        throw new Error('Ledger is not supported yet for delegate actions');
    }

    // InMemorySigner.signMessage applies SHA-256 internally, so we pass the raw preimage.
    const { signature } = await wallet.signer.signMessage(
        dataToSign,
        accountId,
        CONFIG.NETWORK_ID
    );

    // Create SignedDelegate using @near-js/transactions types
    const signedDelegate = new SignedDelegate({
        delegateAction,
        signature: new Signature({
            keyType: publicKey.keyType,
            data: signature,
        }),
    });

    // Serialize using @near-js/transactions
    const signedDelegateBytes = encodeSignedDelegate(signedDelegate);

    // Encode as base64 for transport
    const serialized = Buffer.from(signedDelegateBytes).toString('base64');

    return {
        serialized,
        publicKey: publicKey.toString(),
        accountId,
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
        // gas and deposit are u64/u128 amounts: they must be decimal digit strings. JSON
        // numbers would lose precision on amounts this large, and reach the approval screen
        // in a form NEAR's formatters reject.
        for (const field of ['gas', 'deposit'] as const) {
            const value = action[field];
            if (value !== undefined && !/^\d+$/.test(String(value))) {
                throw new Error(
                    `Action ${field} must be a decimal string of yocto units, got: ${String(
                        value
                    )}`
                );
            }
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

/**
 * Parameters for signing a pre-built delegate action (Wallet Selector spec)
 */
export interface SignPrebuiltDelegateActionParams {
    accountId: string;
    delegateActionBase64: string;
}

/**
 * Decoded DelegateAction info for display
 */
export interface DecodedDelegateActionInfo {
    senderId: string;
    receiverId: string;
    actions: ActionParam[];
    nonce: string;
    maxBlockHeight: string;
    publicKey: string;
}

/**
 * Decodes a base64-encoded DelegateAction for display purposes using the native
 * @near-js/transactions Borsh SCHEMA. Display only: signing always uses the original
 * received bytes (see signPrebuiltDelegateAction), never a re-encoding of this result.
 */
export function decodeDelegateActionForDisplay(
    delegateActionBase64: string
): DecodedDelegateActionInfo {
    let da: DelegateAction;
    try {
        da = nearUtils.serialize.deserialize(
            SCHEMA,
            DelegateAction,
            Buffer.from(delegateActionBase64, 'base64')
        ) as DelegateAction;
    } catch (error) {
        throw new Error(`Failed to decode DelegateAction: ${(error as Error).message}`);
    }

    const actions: ActionParam[] = da.actions.map((action) => {
        if (action.enum !== 'functionCall' || !action.functionCall) {
            throw new Error(`Unsupported action type in DelegateAction: ${action.enum}`);
        }
        const { methodName, args: argsBytes, gas, deposit } = action.functionCall;

        let args: Record<string, unknown> | string;
        const argsText = Buffer.from(argsBytes).toString('utf8');
        try {
            args = JSON.parse(argsText);
        } catch {
            args = argsText;
        }

        return {
            methodName,
            args,
            gas: gas.toString(),
            deposit: deposit.toString(),
        };
    });

    return {
        senderId: da.senderId,
        receiverId: da.receiverId,
        actions,
        nonce: da.nonce.toString(),
        maxBlockHeight: da.maxBlockHeight.toString(),
        publicKey: da.publicKey.toString(),
    };
}

/**
 * Signs a pre-built DelegateAction (Wallet Selector compatible flow)
 *
 * This follows the Wallet Selector spec where the dapp provides a complete
 * DelegateAction and the wallet only signs it.
 *
 * @param params - Parameters including the base64-encoded DelegateAction
 * @returns The signed delegate action and its base64 serialization
 */
export async function signPrebuiltDelegateAction({
    accountId,
    delegateActionBase64,
}: SignPrebuiltDelegateActionParams): Promise<SignedDelegateActionResult> {
    // Decode for validation
    const decoded = decodeDelegateActionForDisplay(delegateActionBase64);

    // Verify the sender matches the logged-in account
    if (decoded.senderId !== accountId) {
        throw new Error(
            `DelegateAction senderId (${decoded.senderId}) does not match logged-in account (${accountId})`
        );
    }

    // Get user's public key from the wallet
    const walletPublicKey = await wallet.signer.getPublicKey(
        accountId,
        CONFIG.NETWORK_ID
    );
    if (!walletPublicKey) {
        throw new Error(`No public key found for account ${accountId}`);
    }

    // The signing key must match the one the dapp put in the DelegateAction. Otherwise the
    // relayer-submitted meta-transaction would carry a nonce derived for a different key and
    // be rejected on-chain, so fail loudly instead of signing something unusable.
    if (decoded.publicKey !== walletPublicKey.toString()) {
        throw new Error(
            `DelegateAction publicKey (${
                decoded.publicKey
            }) does not match the signing key for ${accountId} (${walletPublicKey.toString()})`
        );
    }

    // Ledger is not supported yet for delegate actions (see createSignedDelegateAction).
    if (await wallet.getLedgerKey(accountId)) {
        throw new Error('Ledger is not supported yet for delegate actions');
    }

    // Sign the EXACT bytes the dapp built. The NEP-366 preimage is the 4-byte DelegateAction
    // prefix followed by the received Borsh bytes, unchanged. We never rebuild the
    // DelegateAction: re-serializing args through JSON.stringify is not byte-stable, so the
    // signature would otherwise cover different bytes than the dapp built and the user saw.
    const raw = Buffer.from(delegateActionBase64, 'base64');
    const dataToSign = Buffer.concat([NEP366_DELEGATE_ACTION_PREFIX, raw]);

    // InMemorySigner.signMessage applies SHA-256 internally, so we pass the raw preimage.
    const { signature } = await wallet.signer.signMessage(
        dataToSign,
        accountId,
        CONFIG.NETWORK_ID
    );

    // A SignedDelegate is Borsh(DelegateAction) ++ Borsh(Signature). Borsh is concatenative,
    // so append the already-serialized DelegateAction bytes and the Signature (1-byte ED25519
    // key type + 64-byte signature) directly, again without re-encoding anything.
    const signedDelegateBytes = Buffer.concat([
        raw,
        Buffer.from([walletPublicKey.keyType]),
        Buffer.from(signature),
    ]);
    const serialized = signedDelegateBytes.toString('base64');

    return {
        serialized,
        publicKey: walletPublicKey.toString(),
        accountId,
    };
}
