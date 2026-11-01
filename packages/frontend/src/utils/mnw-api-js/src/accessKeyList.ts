import { TypedError } from 'near-api-js/lib/providers';
import { AccessKeyList } from 'near-api-js/lib/providers/provider';

/** Keys per `view_access_key_list` page. Nodes refuse the unpaginated list above 100 keys. */
export const ACCESS_KEY_LIST_PAGE_SIZE = 100;
/** Stops a misbehaving node from paging forever (100,000 keys). */
const ACCESS_KEY_LIST_MAX_PAGES = 1000;

export interface AccessKeyListQuery {
    request_type: 'view_access_key_list';
    account_id: string;
    finality?: string;
    block_id?: number | string;
    limit?: number;
    after_key?: string;
}

export interface AccessKeyListPage extends AccessKeyList {
    /** Set on a full page of a paginated list: the next page starts after it. */
    last_key?: string;
}

/**
 * Whether a `query` request is an unpaginated `view_access_key_list`: the request current nodes
 * refuse outright (`TOO_MANY_ACCESS_KEYS`) for an account with more than 100 keys.
 */
export const isUnpaginatedAccessKeyListQuery = (
    params: any
): params is AccessKeyListQuery =>
    params != null &&
    typeof params === 'object' &&
    params.request_type === 'view_access_key_list' &&
    params.limit == null &&
    params.after_key == null;

/**
 * All of an account's access keys, in the shape of one unpaginated answer.
 *
 * Always paginated: current nodes answer `TOO_MANY_ACCESS_KEYS` to an unpaginated request for an
 * account with more than 100 keys (common on accounts that signed in to many apps), which failed
 * every account load, key screen and export for such an account. Nodes without pagination ignore
 * `limit` and return everything in one page. Later pages are read at the first page's block, so
 * the list is one consistent view. An incomplete list throws: callers decide what a key may do
 * from this list, and must never decide from part of it.
 */
export const queryAccessKeyList = async (
    query: (params: AccessKeyListQuery) => Promise<AccessKeyListPage>,
    params: AccessKeyListQuery
): Promise<AccessKeyList> => {
    const keys: AccessKeyList['keys'] = [];
    let blockHeight: number | undefined;
    let blockHash = '';
    let afterKey: string | undefined;

    for (let page = 0; page < ACCESS_KEY_LIST_MAX_PAGES; page++) {
        const response = await query({
            request_type: 'view_access_key_list',
            account_id: params.account_id,
            ...(blockHeight == null
                ? params.block_id != null
                    ? { block_id: params.block_id }
                    : { finality: params.finality }
                : { block_id: blockHeight }),
            limit: ACCESS_KEY_LIST_PAGE_SIZE,
            ...(afterKey != null ? { after_key: afterKey } : {}),
        });
        if (blockHeight == null) {
            blockHeight = response?.block_height;
            blockHash = response?.block_hash ?? '';
        }
        if (!Array.isArray(response?.keys)) {
            throw new TypedError(
                `NEAR returned an incomplete key list for ${params.account_id}.`,
                'AccessKeyListIncomplete'
            );
        }
        keys.push(...response.keys);
        const lastKey =
            typeof response.last_key === 'string' ? response.last_key : undefined;
        if (lastKey == null) {
            return { block_height: blockHeight, block_hash: blockHash, keys };
        }
        if (response.keys.length === 0 || lastKey === afterKey || blockHeight == null) {
            throw new TypedError(
                `The key list of ${params.account_id} did not advance past ${lastKey}.`,
                'AccessKeyListIncomplete'
            );
        }
        afterKey = lastKey;
    }
    throw new TypedError(
        `The key list of ${params.account_id} has more than ${ACCESS_KEY_LIST_MAX_PAGES} pages.`,
        'AccessKeyListIncomplete'
    );
};
