import {
    BROWSER_STORAGE_FULL_CODE,
    describeBrowserStorageUsage,
    isBrowserStorageFullError,
    releaseDisposableBrowserStorage,
    withBrowserStorageRoom,
} from './browserStorage';
import { keepPersistMarkedQueries } from '../utils/query/queryClient';
import {
    describeNewKeyTransferError,
    safeNewKeyTransferErrorCode,
} from './newKeyTransferState';

/** A `Storage`-shaped map, so each test controls exactly what the origin holds. */
const fakeStorage = (entries) => {
    const values = new Map(Object.entries(entries));
    return {
        values,
        get length() {
            return values.size;
        },
        key: (index) => [...values.keys()][index] ?? null,
        getItem: (key) => (values.has(key) ? values.get(key) : null),
        removeItem: (key) => values.delete(key),
    };
};

const quotaError = () =>
    new DOMException(
        'Setting the value of met_data_newKeyTransferSessions exceeded the quota.',
        'QuotaExceededError'
    );

const sdkStorageFullError = () =>
    Object.assign(new Error('new_key_transfer_storage_full', { cause: quotaError() }), {
        name: 'NewKeyTransferError',
        code: 'new_key_transfer_storage_full',
    });

describe('isBrowserStorageFullError', () => {
    test('recognizes the browser error, the SDK code and either one as a cause', () => {
        expect(isBrowserStorageFullError(quotaError())).toBe(true);
        expect(isBrowserStorageFullError(sdkStorageFullError())).toBe(true);
        expect(
            isBrowserStorageFullError(
                new Error('new_key_transfer_verify_session_update_failed', {
                    cause: sdkStorageFullError(),
                })
            )
        ).toBe(true);
        expect(isBrowserStorageFullError(new Error(BROWSER_STORAGE_FULL_CODE))).toBe(
            true
        );
    });

    test('does not claim other failures, including ones that mention quota', () => {
        expect(isBrowserStorageFullError(new Error('rate limit quota exceeded'))).toBe(
            false
        );
        expect(isBrowserStorageFullError('QuotaExceededError')).toBe(false);
        expect(isBrowserStorageFullError(undefined)).toBe(false);
    });
});

describe('releaseDisposableBrowserStorage', () => {
    test('drops caches and analytics queues, never keys, accounts or the journal', () => {
        const storage = fakeStorage({
            REACT_QUERY_OFFLINE_CACHE: 'x'.repeat(5000),
            __mpq_token_ev: '[]',
            'nearlib:keystore:alice.near:mainnet': 'ed25519:secret',
            MNW_WALLET_DATA: '{}',
            '_4:wallet:accounts_v2': '{}',
            met_data_newKeyTransferSessions: '[]',
            met_data_newKeyTransferAddKeyJournal: '{}',
            'mnw:newKeyTransfer:pendingStart:v1': '{}',
        });

        const freed = releaseDisposableBrowserStorage(storage);

        expect(freed).toBe(
            'REACT_QUERY_OFFLINE_CACHE'.length + 5000 + '__mpq_token_ev'.length + 2
        );
        expect([...storage.values.keys()]).toEqual([
            'nearlib:keystore:alice.near:mainnet',
            'MNW_WALLET_DATA',
            '_4:wallet:accounts_v2',
            'met_data_newKeyTransferSessions',
            'met_data_newKeyTransferAddKeyJournal',
            'mnw:newKeyTransfer:pendingStart:v1',
        ]);
    });
});

describe('describeBrowserStorageUsage', () => {
    test('reports families by size and never a key that can name an account', () => {
        const storage = fakeStorage({
            REACT_QUERY_OFFLINE_CACHE: 'x'.repeat(800_000),
            'nearlib:keystore:alice.near:mainnet': 'x'.repeat(30_000),
            'nearlib:keystore:bob.near:mainnet': 'x'.repeat(30_000),
            '__SVPRE__validator.poolv1.nearalice.near': 'x'.repeat(10_000),
            'some-unknown-key-alice.near': 'x'.repeat(200_000),
        });

        const usage = describeBrowserStorageUsage(storage);

        expect(usage).toBe(
            '1,070K chars · REACT_QUERY_OFFLINE_CACHE 800K · other 200K · nearlib:keystore:* 60K · __SVPRE__* 10K'
        );
        expect(usage).not.toContain('alice');
    });
});

describe('withBrowserStorageRoom', () => {
    test('frees disposable entries before the step runs', async () => {
        const storage = fakeStorage({ REACT_QUERY_OFFLINE_CACHE: '{}' });
        const result = await withBrowserStorageRoom(async () => {
            expect(storage.values.has('REACT_QUERY_OFFLINE_CACHE')).toBe(false);
            return 'done';
        }, storage);
        expect(result).toBe('done');
    });

    test('a full storage becomes the typed code, with the cause and the usage attached', async () => {
        const storage = fakeStorage({
            met_data_newKeyTransferSessions: 'x'.repeat(4000),
        });
        const original = quotaError();

        const failure = await withBrowserStorageRoom(async () => {
            throw original;
        }, storage).catch((error) => error);

        expect(failure.message).toBe(BROWSER_STORAGE_FULL_CODE);
        expect(failure.cause).toBe(original);
        expect(failure.storageUsage).toBe(
            '4K chars · met_data_newKeyTransferSessions 4K'
        );
    });

    test('any other failure passes through untouched', async () => {
        const other = new Error('new_key_transfer_client_id_conflict');
        await expect(
            withBrowserStorageRoom(async () => {
                throw other;
            }, fakeStorage({}))
        ).rejects.toBe(other);
    });
});

describe('storage-full errors on the transfer screens', () => {
    test('get their own copy, the usage in the support code, and a safe analytics code', () => {
        const typed = Object.assign(new Error(BROWSER_STORAGE_FULL_CODE), {
            storageUsage: '5,100K chars · other 4,000K',
        });

        expect(describeNewKeyTransferError(typed)).toEqual({
            i18nKey: 'newKeyTransfer.error.browserStorageFull',
            code: `${BROWSER_STORAGE_FULL_CODE} · 5,100K chars · other 4,000K`,
            isFenced: false,
        });
        // The raw browser error from an SDK that predates the typed code reads the same.
        expect(describeNewKeyTransferError(quotaError())).toEqual({
            i18nKey: 'newKeyTransfer.error.browserStorageFull',
            code: BROWSER_STORAGE_FULL_CODE,
            isFenced: false,
        });
        expect(safeNewKeyTransferErrorCode(quotaError())).toBe(BROWSER_STORAGE_FULL_CODE);
        expect(safeNewKeyTransferErrorCode(sdkStorageFullError())).toBe(
            BROWSER_STORAGE_FULL_CODE
        );
    });
});

describe('keepPersistMarkedQueries', () => {
    test('filters the queries restore actually reads, and adds nothing beside them', () => {
        const query = (queryKey) => ({ queryKey, queryHash: JSON.stringify(queryKey) });
        const client = {
            timestamp: 1,
            buster: '',
            clientState: {
                mutations: [],
                queries: [
                    query(['getMetadata', 'token.near']),
                    query(['recent_provider_validator_ids', 'persist']),
                    query(['nftDetail', 'ref']),
                ],
            },
        };

        const persisted = keepPersistMarkedQueries(client);

        expect(persisted.clientState.queries.map(({ queryKey }) => queryKey)).toEqual([
            ['recent_provider_validator_ids', 'persist'],
        ]);
        expect(Object.keys(persisted)).toEqual(['timestamp', 'buster', 'clientState']);
    });
});
