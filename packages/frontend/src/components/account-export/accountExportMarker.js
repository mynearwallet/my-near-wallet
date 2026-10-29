const EXPORTED_STORAGE_KEY = 'mnw:sunset:exported';

const readMarkers = () => {
    try {
        const markers = JSON.parse(localStorage.getItem(EXPORTED_STORAGE_KEY) || '{}');
        return markers && typeof markers === 'object' ? markers : {};
    } catch {
        return {};
    }
};

/**
 * Remembers that the user revealed or copied an account's private key during manual export, so
 * migration status can show "key exported". Only the account id, the method and a timestamp are
 * stored. Never key material.
 */
export const markAccountKeyExported = (accountId, method = 'manual') => {
    if (typeof accountId !== 'string' || accountId.length === 0) {
        return;
    }
    try {
        localStorage.setItem(
            EXPORTED_STORAGE_KEY,
            JSON.stringify({ ...readMarkers(), [accountId]: { method, at: Date.now() } })
        );
    } catch {
        // Status display only; storage failures (e.g. private mode) must never block export.
    }
};

export const getExportedAccountMarkers = () => readMarkers();
