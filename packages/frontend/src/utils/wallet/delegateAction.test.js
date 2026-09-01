/**
 * @jest-environment node
 */
import { createHash } from 'crypto';

import { utils as nearUtils } from 'near-api-js';
import {
    SCHEMA,
    DelegateAction,
    buildDelegateAction,
    encodeDelegateAction,
    encodeSignedDelegate,
    SignedDelegate,
    Signature,
    actionCreators,
} from '@near-js/transactions';
import { KeyPairEd25519 } from '@near-js/crypto';

/*
 * Cross-validates our NEP-366 handling against the native @near-js/transactions and borsh
 * libraries: the decoder must round-trip every field, and the bytes we sign and serialize
 * must be identical to what encodeDelegateAction/encodeSignedDelegate produce.
 *
 * delegateAction.js pulls in the wallet singleton and app config for its signing paths, so
 * both are mocked to keep the decode/serialize logic testable in isolation.
 */

jest.mock('../wallet', () => ({ wallet: {} }));
jest.mock('../../config', () => ({
    __esModule: true,
    default: { NETWORK_ID: 'mainnet' },
}));

// eslint-disable-next-line import/first
import {
    decodeDelegateActionForDisplay,
    formatActionArgs,
    validateDelegateActionParams,
    NEP366_DELEGATE_ACTION_PREFIX,
} from './delegateAction';

// Ephemeral test key pair, generated per run - never a real account key.
const keyPair = KeyPairEd25519.fromRandom();
const publicKey = keyPair.getPublicKey();

// Pretty-printed args are the case the old rebuild path corrupted: JSON.stringify is not
// byte-stable, and a payload built in Python carries both spaces and \uXXXX escapes.
const prettyArgs = Buffer.from(
    '{\n  "receiver_id": "bob.near",\n  "amount": "1000000"\n}'
);

const buildFunctionCallDelegate = () =>
    buildDelegateAction({
        actions: [
            actionCreators.functionCall('ft_transfer', prettyArgs, 30000000000000n, 1n),
        ],
        maxBlockHeight: 100n,
        nonce: 5n,
        publicKey,
        receiverId: 'usdc.near',
        senderId: 'alice.near',
    });

// borsh(DelegateAction) without the NEP-366 prefix, i.e. what a dapp sends as base64.
const rawBase64 = (delegateAction) =>
    Buffer.from(encodeDelegateAction(delegateAction).slice(4)).toString('base64');

describe('decodeDelegateActionForDisplay', () => {
    test('round-trips every field of a FunctionCall DelegateAction', () => {
        const decoded = decodeDelegateActionForDisplay(
            rawBase64(buildFunctionCallDelegate())
        );

        expect(decoded.senderId).toBe('alice.near');
        expect(decoded.receiverId).toBe('usdc.near');
        expect(decoded.nonce).toBe('5');
        expect(decoded.maxBlockHeight).toBe('100');
        expect(decoded.publicKey).toBe(publicKey.toString());
        expect(decoded.actions).toHaveLength(1);
        expect(decoded.actions[0].methodName).toBe('ft_transfer');
        expect(decoded.actions[0].gas).toBe('30000000000000');
        expect(decoded.actions[0].deposit).toBe('1');
        expect(decoded.actions[0].args).toEqual({
            receiver_id: 'bob.near',
            amount: '1000000',
        });
    });

    test('rejects non-FunctionCall actions cleanly', () => {
        const delegateAction = buildDelegateAction({
            actions: [actionCreators.transfer(5n)],
            maxBlockHeight: 100n,
            nonce: 5n,
            publicKey,
            receiverId: 'bob.near',
            senderId: 'alice.near',
        });

        expect(() => decodeDelegateActionForDisplay(rawBase64(delegateAction))).toThrow(
            /Unsupported action type/
        );
    });
});

describe('validateDelegateActionParams', () => {
    const withAmounts = (overrides) => ({
        receiverId: 'usdc.near',
        actions: [{ methodName: 'ft_transfer', ...overrides }],
    });

    test('accepts decimal digit strings for gas and deposit', () => {
        expect(
            validateDelegateActionParams(
                withAmounts({ gas: '30000000000000', deposit: '1' })
            )
        ).toBe(true);
        expect(validateDelegateActionParams(withAmounts({}))).toBe(true);
    });

    test('rejects amounts that are not decimal strings', () => {
        // JSON numbers lose precision at yocto scale and break NEAR's formatters.
        expect(() =>
            validateDelegateActionParams(withAmounts({ deposit: 1e24 }))
        ).toThrow(/deposit must be a decimal string/);
        expect(() => validateDelegateActionParams(withAmounts({ gas: 'abc' }))).toThrow(
            /gas must be a decimal string/
        );
    });
});

describe('formatActionArgs', () => {
    test('pretty-prints objects and passes through non-JSON strings', () => {
        expect(formatActionArgs({ a: 1 })).toBe('{\n  "a": 1\n}');
        expect(formatActionArgs('not json')).toBe('not json');
        expect(formatActionArgs(undefined)).toBeNull();
    });
});

describe('signing serialization matches the native libraries', () => {
    test('the signed preimage equals encodeDelegateAction', () => {
        const delegateAction = buildFunctionCallDelegate();
        const raw = Buffer.from(rawBase64(delegateAction), 'base64');

        const ours = Buffer.concat([NEP366_DELEGATE_ACTION_PREFIX, raw]);

        expect(
            Buffer.compare(ours, Buffer.from(encodeDelegateAction(delegateAction)))
        ).toBe(0);
    });

    test('the serialized SignedDelegate equals encodeSignedDelegate and verifies', () => {
        const delegateAction = buildFunctionCallDelegate();
        const raw = Buffer.from(rawBase64(delegateAction), 'base64');

        // Mirrors InMemorySigner.signMessage: SHA-256 the preimage, then ED25519 sign it.
        const hash = createHash('sha256')
            .update(Buffer.concat([NEP366_DELEGATE_ACTION_PREFIX, raw]))
            .digest();
        const { signature } = keyPair.sign(hash);

        const ours = Buffer.concat([
            raw,
            Buffer.from([publicKey.keyType]),
            Buffer.from(signature),
        ]);
        const native = Buffer.from(
            encodeSignedDelegate(
                new SignedDelegate({
                    delegateAction,
                    signature: new Signature({
                        keyType: publicKey.keyType,
                        data: signature,
                    }),
                })
            )
        );

        expect(Buffer.compare(ours, native)).toBe(0);
        expect(publicKey.verify(hash, signature)).toBe(true);
    });

    test('deserialize round-trips the original bytes unchanged', () => {
        const raw = Buffer.from(rawBase64(buildFunctionCallDelegate()), 'base64');
        const back = nearUtils.serialize.deserialize(SCHEMA, DelegateAction, raw);

        expect(
            Buffer.compare(Buffer.from(encodeDelegateAction(back).slice(4)), raw)
        ).toBe(0);
    });
});
