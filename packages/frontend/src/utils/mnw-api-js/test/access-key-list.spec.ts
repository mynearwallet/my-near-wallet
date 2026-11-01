import { describe, expect, jest, test } from '@jest/globals';

import {
    ACCESS_KEY_LIST_PAGE_SIZE,
    isUnpaginatedAccessKeyListQuery,
    queryAccessKeyList,
    RpcProvider,
} from '..';

const keyEntry = (index: number) => ({
    public_key: `ed25519:key${index}`,
    access_key: { nonce: index, permission: 'FullAccess' },
});

const keyRange = (from: number, count: number) =>
    Array.from({ length: count }, (_, offset) => keyEntry(from + offset));

const baseQuery = {
    request_type: 'view_access_key_list' as const,
    account_id: 'lele.near',
    finality: 'final',
};

describe('queryAccessKeyList', () => {
    test('a list that fits one page is read with one paginated request', async () => {
        const query = jest.fn<(params: any) => Promise<any>>(async () => ({
            block_height: 10,
            block_hash: 'hash10',
            keys: keyRange(0, 3),
        }));

        const list = await queryAccessKeyList(query, baseQuery);

        expect(list).toEqual({
            block_height: 10,
            block_hash: 'hash10',
            keys: keyRange(0, 3),
        });
        expect(query).toHaveBeenCalledTimes(1);
        expect(query.mock.calls[0][0]).toEqual({
            ...baseQuery,
            limit: ACCESS_KEY_LIST_PAGE_SIZE,
        });
    });

    test('later pages continue after last_key, pinned to the first page block', async () => {
        const pages = [
            {
                block_height: 222554439,
                block_hash: 'first',
                keys: keyRange(0, 100),
                last_key: 'ed25519:key99',
            },
            { block_height: 222554439, block_hash: 'first', keys: keyRange(100, 66) },
        ];
        const query = jest.fn<(params: any) => Promise<any>>(async () => pages.shift());

        const list = await queryAccessKeyList(query, baseQuery);

        expect(list.keys).toHaveLength(166);
        expect(list.block_height).toBe(222554439);
        expect(query.mock.calls[1][0]).toEqual({
            request_type: 'view_access_key_list',
            account_id: 'lele.near',
            block_id: 222554439,
            limit: ACCESS_KEY_LIST_PAGE_SIZE,
            after_key: 'ed25519:key99',
        });
    });

    test('a node without pagination answers everything in one page', async () => {
        const query = jest.fn<(params: any) => Promise<any>>(async () => ({
            block_height: 5,
            block_hash: 'hash5',
            keys: keyRange(0, 250),
        }));

        const list = await queryAccessKeyList(query, baseQuery);

        expect(list.keys).toHaveLength(250);
        expect(query).toHaveBeenCalledTimes(1);
    });

    test('a block_id request keeps its block for the first page', async () => {
        const query = jest.fn<(params: any) => Promise<any>>(async () => ({
            block_height: 7,
            block_hash: 'hash7',
            keys: [],
        }));

        await queryAccessKeyList(query, {
            request_type: 'view_access_key_list',
            account_id: 'lele.near',
            block_id: 7,
        });

        expect(query.mock.calls[0][0]).toEqual({
            request_type: 'view_access_key_list',
            account_id: 'lele.near',
            block_id: 7,
            limit: ACCESS_KEY_LIST_PAGE_SIZE,
        });
    });

    test('a last_key that does not advance throws instead of looping', async () => {
        const query = jest.fn<(params: any) => Promise<any>>(async () => ({
            block_height: 1,
            block_hash: 'hash1',
            keys: keyRange(0, 100),
            last_key: 'ed25519:stuck',
        }));

        await expect(queryAccessKeyList(query, baseQuery)).rejects.toThrow(
            'did not advance'
        );
        expect(query).toHaveBeenCalledTimes(2);
    });

    test('an empty page that still claims more keys throws', async () => {
        const query = jest.fn<(params: any) => Promise<any>>(async () => ({
            block_height: 1,
            block_hash: 'hash1',
            keys: [],
            last_key: 'ed25519:more',
        }));

        await expect(queryAccessKeyList(query, baseQuery)).rejects.toThrow(
            'did not advance'
        );
    });

    test('a page without a key array throws rather than returning part of the list', async () => {
        const pages: any[] = [
            { block_height: 1, block_hash: 'h', keys: keyRange(0, 100), last_key: 'k' },
            { block_height: 1, block_hash: 'h' },
        ];
        const query = jest.fn<(params: any) => Promise<any>>(async () => pages.shift());

        await expect(queryAccessKeyList(query, baseQuery)).rejects.toThrow(
            'incomplete key list'
        );
    });
});

describe('isUnpaginatedAccessKeyListQuery', () => {
    test('only an access key list request without paging fields matches', () => {
        expect(isUnpaginatedAccessKeyListQuery(baseQuery)).toBe(true);
        expect(isUnpaginatedAccessKeyListQuery({ ...baseQuery, limit: 100 })).toBe(false);
        expect(isUnpaginatedAccessKeyListQuery({ ...baseQuery, after_key: 'k' })).toBe(
            false
        );
        expect(
            isUnpaginatedAccessKeyListQuery({
                request_type: 'view_access_key',
                account_id: 'a',
            })
        ).toBe(false);
        expect(isUnpaginatedAccessKeyListQuery(undefined)).toBe(false);
    });
});

describe('RpcProvider.query', () => {
    test('pages an unpaginated access key list and passes other queries through', async () => {
        const provider = new RpcProvider('https://rpc.invalid');
        const pages = [
            { block_height: 3, block_hash: 'h3', keys: keyRange(0, 100), last_key: 'k' },
            { block_height: 3, block_hash: 'h3', keys: keyRange(100, 1) },
        ];
        const sendJsonRpc = jest.fn(async (_method: string, params: any) =>
            params.request_type === 'view_access_key_list'
                ? pages.shift()
                : { block_height: 3, block_hash: 'h3', amount: '1' }
        );
        provider.sendJsonRpc = sendJsonRpc as any;

        const list: any = await provider.query(baseQuery);
        const account: any = await provider.query({
            request_type: 'view_account',
            account_id: 'lele.near',
            finality: 'final',
        });

        expect(list.keys).toHaveLength(101);
        expect(account.amount).toBe('1');
        expect(sendJsonRpc.mock.calls.map(([, params]: any) => params.limit)).toEqual([
            ACCESS_KEY_LIST_PAGE_SIZE,
            ACCESS_KEY_LIST_PAGE_SIZE,
            undefined,
        ]);
    });
});
