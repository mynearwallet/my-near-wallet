import {
    keyAccountConfirmed,
    keyStakingAccountSelected,
    keyReleaseNotesModalClosed,
    KEY_STORE_PREFIX,
} from './wallet';

export const setAccountConfirmed = (accountId, confirmed) => {
    localStorage.setItem(keyAccountConfirmed(accountId), confirmed);
};

export const getAccountConfirmed = (accountId) => {
    return localStorage.getItem(keyAccountConfirmed(accountId)) === 'true';
};

export const removeAccountConfirmed = (accountId) => {
    localStorage.removeItem(keyAccountConfirmed(accountId));
};

export const setStakingAccountSelected = (accountId) => {
    localStorage.setItem(keyStakingAccountSelected(), accountId);
};
export const getStakingAccountSelected = () => {
    return localStorage.getItem(keyStakingAccountSelected());
};

export const setReleaseNotesClosed = (version) => {
    localStorage.setItem(keyReleaseNotesModalClosed(version), String(true));
};

export const getReleaseNotesClosed = (version) => {
    return localStorage.getItem(keyReleaseNotesModalClosed(version));
};

export const setLedgerHdPath = ({ accountId, path }) => {
    localStorage.setItem(`ledgerHdPath:${accountId}`, path);
};

export const setWalletAccounts = (walletAccountsKey, walletAccounts) => {
    localStorage.setItem(walletAccountsKey, JSON.stringify(walletAccounts));
};

export const removeActiveAccount = (activeAccountKey) => {
    localStorage.removeItem(activeAccountKey);
};

export const getLedgerHDPath = (accountId) => {
    return localStorage.getItem(`ledgerHdPath:${accountId}`);
};

export const removeLedgerHDPath = (accountId) => {
    localStorage.removeItem(`ledgerHdPath:${accountId}`);
};

export type TDecryptedAccount = {
    accountId: string;
    privateKey: string;
    seedPhrase?: string;
};

export const retrieveAllAccountsPrivateKey = (): TDecryptedAccount[] => {
    const items = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key.startsWith(KEY_STORE_PREFIX)) {
            const item = localStorage.getItem(key);
            let accountId = key.replace(KEY_STORE_PREFIX, '');
            accountId = accountId.split(':')[0];
            items.push({ accountId, privateKey: item });
        }
    }
    return items;
};

export const removeAllAccountsPrivateKey = () => {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key.startsWith(KEY_STORE_PREFIX)) {
            localStorage.removeItem(key);
        }
    }
};

export type TEncryptedData = {
    encryptedAccounts?: string;
    salt?: string;
    isEncryptionEnabled?: boolean;
};

export const setEncryptedData = (payload: TEncryptedData) => {
    const oriPayload = getEncryptedData();
    localStorage.setItem('ENCRYPTED_DATA', JSON.stringify({ ...oriPayload, ...payload }));
};

export const getEncryptedData = (): TEncryptedData => {
    return JSON.parse(localStorage.getItem('ENCRYPTED_DATA'));
};
