import { describe, expect, it, jest } from '@jest/globals';

import { CoreIndexerNoResultError } from './indexers/AbstractCoreIndexer';

const mockLookups: Record<string, jest.Mock<(publicKey: string) => Promise<string[]>>> = {
    fastNear: jest.fn(),
    nearblocks: jest.fn(),
};

const mockIndexer = (key: string, priority: number) =>
    class {
        networkSupported = ['mainnet', 'testnet'];
        priority = priority;
        methodsSupported = ['getAccountIdListFromPublicKey'];
        getAccountIdListFromPublicKey(publicKey: string) {
            return mockLookups[key](publicKey);
        }
    };

jest.mock('../../config', () => ({}));
jest.mock('./indexers/FastNearIndexer', () => ({
    FastNearIndexer: mockIndexer('fastNear', 1),
}));
jest.mock('./indexers/NearblocksV3Indexer', () => ({
    NearblocksV3Indexer: mockIndexer('nearblocks', 2),
}));
jest.mock('./indexers/MintbaseIndexer', () => ({
    MintbaseIndexer: class {
        networkSupported = ['mainnet', 'testnet'];
        priority = 3;
        methodsSupported = ['getNftDetailByReference'];
    },
}));

// eslint-disable-next-line import/first
import { CoreIndexerAdapter } from './CoreIndexerAdapter';

const confirm = () =>
    CoreIndexerAdapter.getInstance('mainnet' as any).confirmNoAccountIdsForPublicKey(
        'ed25519:key',
        50
    );

const noResult = () => Promise.reject(new CoreIndexerNoResultError('none'));
const outage = () => Promise.reject(new Error('Failed to fetch'));

describe('confirming that no account uses a public key', () => {
    it('confirms when an indexer answered with nothing and the other is down', async () => {
        mockLookups.fastNear.mockImplementation(noResult);
        mockLookups.nearblocks.mockImplementation(outage);
        await expect(confirm()).resolves.toBe(true);
    });

    it('does not confirm when every indexer is down', async () => {
        mockLookups.fastNear.mockImplementation(outage);
        mockLookups.nearblocks.mockImplementation(outage);
        await expect(confirm()).resolves.toBe(false);
    });

    it('does not confirm when an indexer finds an account', async () => {
        mockLookups.fastNear.mockImplementation(noResult);
        mockLookups.nearblocks.mockResolvedValue(['alice.near']);
        await expect(confirm()).resolves.toBe(false);
    });

    it('treats a hanging indexer as no answer', async () => {
        mockLookups.fastNear.mockImplementation(() => new Promise(() => undefined));
        mockLookups.nearblocks.mockImplementation(outage);
        await expect(confirm()).resolves.toBe(false);
    });
});
