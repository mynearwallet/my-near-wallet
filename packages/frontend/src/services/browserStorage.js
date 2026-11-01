/**
 * Room in this origin's localStorage for Meteor Connect's transfer journal.
 *
 * The SDK records every transfer step in localStorage (`met_data_*`), beside everything this
 * wallet has stored there over the years. Browsers cap localStorage per origin at roughly five
 * million characters, and a full origin refuses the journal's very first write — which ended a
 * transfer before Meteor Wallet was even opened, with the browser's own sentence as the only
 * explanation (`Failed to execute 'setItem' on 'Storage': ... exceeded the quota`).
 */

/** The code this wallet raises when the journal still cannot be written after making room. */
export const BROWSER_STORAGE_FULL_CODE = 'new_key_transfer_browser_storage_full';

/** The SDK's own typed code for the same condition (SDK releases after 3.24.1). */
const SDK_STORAGE_FULL_CODE = 'new_key_transfer_storage_full';

/**
 * Entries this wallet can drop at any time without losing anything: each one is a cache it
 * rebuilds on its own or an analytics queue. Keys, accounts, settings and the transfer journal
 * itself are never on this list.
 */
const DISPOSABLE_KEYS = [
    // The persisted React Query cache (`utils/query/queryClient.ts`).
    'REACT_QUERY_OFFLINE_CACHE',
];
const DISPOSABLE_PREFIXES = [
    // Mixpanel's unsent-event queues (`__mpq_<token>_ev|_pp|_gr`). Mixpanel is retired here.
    '__mpq_',
];

/**
 * Key families the support breakdown names. Anything else is counted as `other`, so no key name
 * that could carry an account id (`__SVPRE__<validator><account>`, `nearlib:keystore:<account>`)
 * ever appears in it.
 */
const USAGE_FAMILIES = [
    { prefix: 'REACT_QUERY_OFFLINE_CACHE', exact: true },
    { prefix: 'MNW_WALLET_DATA', exact: true },
    { prefix: 'connections', exact: true },
    { prefix: 'met_data_', keepKey: true },
    { prefix: 'met_bridge_partner::' },
    { prefix: 'met_bridge_lease::' },
    { prefix: 'met_v1_sdk_' },
    { prefix: 'nearlib:keystore:' },
    { prefix: '_4:wallet:' },
    { prefix: 'keyMeta:' },
    { prefix: 'ledgerHdPath:' },
    { prefix: '__SVPRE__' },
    { prefix: '__mpq_' },
    { prefix: 'mp_' },
    { prefix: 'ph_' },
    { prefix: 'mnw:' },
];

const QUOTA_ERROR_NAMES = ['QuotaExceededError', 'NS_ERROR_DOM_QUOTA_REACHED'];

const storageKeys = (storage) => {
    const keys = [];
    for (let index = 0; index < storage.length; index++) {
        const key = storage.key(index);
        if (key != null) {
            keys.push(key);
        }
    }
    return keys;
};

/**
 * Whether an error, or anything in its `cause` chain, says the browser storage is full. Read from
 * the error's type and the typed codes — never its message, which each browser words differently.
 */
export const isBrowserStorageFullError = (error) => {
    let current = error;
    for (let depth = 0; depth < 5 && current != null; depth++) {
        if (typeof current !== 'object') {
            return false;
        }
        if (
            QUOTA_ERROR_NAMES.includes(current.name) ||
            current.code === SDK_STORAGE_FULL_CODE ||
            current.message === BROWSER_STORAGE_FULL_CODE
        ) {
            return true;
        }
        current = current.cause;
    }
    return false;
};

/** Remove every disposable entry; returns how many characters that freed. */
export const releaseDisposableBrowserStorage = (storage = window.localStorage) => {
    let freed = 0;
    try {
        for (const key of storageKeys(storage)) {
            if (
                DISPOSABLE_KEYS.includes(key) ||
                DISPOSABLE_PREFIXES.some((prefix) => key.startsWith(prefix))
            ) {
                freed += key.length + (storage.getItem(key) || '').length;
                storage.removeItem(key);
            }
        }
    } catch {
        // Storage that cannot even be enumerated has nothing this can free.
    }
    return freed;
};

const familyOf = (key) => {
    const family = USAGE_FAMILIES.find(({ prefix, exact }) =>
        exact ? key === prefix : key.startsWith(prefix)
    );
    if (family == null) {
        return 'other';
    }
    return family.exact || family.keepKey ? key : `${family.prefix}*`;
};

const formatChars = (chars) => `${Math.round(chars / 1000).toLocaleString('en-US')}K`;

/**
 * What fills this origin's localStorage, in characters, by key family: support-code fine print
 * that says which data is holding the space. Families only — see `USAGE_FAMILIES`.
 */
export const describeBrowserStorageUsage = (storage = window.localStorage, top = 4) => {
    try {
        const sizes = new Map();
        let total = 0;
        for (const key of storageKeys(storage)) {
            const size = key.length + (storage.getItem(key) || '').length;
            total += size;
            const family = familyOf(key);
            sizes.set(family, (sizes.get(family) || 0) + size);
        }
        const largest = [...sizes]
            .sort(([, left], [, right]) => right - left)
            .slice(0, top)
            .map(([family, size]) => `${family} ${formatChars(size)}`);
        return [`${formatChars(total)} chars`, ...largest].join(' · ');
    } catch {
        return 'storage unreadable';
    }
};

/**
 * Run a step that writes the transfer journal, with every disposable entry released first. A full
 * storage then surfaces as `BROWSER_STORAGE_FULL_CODE`, carrying the original error as its cause
 * and the usage breakdown for the support code.
 */
export const withBrowserStorageRoom = async (
    operation,
    storage = window.localStorage
) => {
    releaseDisposableBrowserStorage(storage);
    try {
        return await operation();
    } catch (error) {
        if (!isBrowserStorageFullError(error)) {
            throw error;
        }
        const storageFull = new Error(BROWSER_STORAGE_FULL_CODE, { cause: error });
        storageFull.storageUsage = describeBrowserStorageUsage(storage);
        throw storageFull;
    }
};
