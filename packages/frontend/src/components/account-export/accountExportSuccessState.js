const ACCOUNT_EXPORT_SUCCESS_STORAGE_KEY = 'account-export-success';

const isAccountIdList = (accountIds) =>
    Array.isArray(accountIds) &&
    accountIds.length > 0 &&
    accountIds.every((accountId) => typeof accountId === 'string');

export const saveAccountExportSuccess = (accountIds) => {
    if (typeof window === 'undefined' || !isAccountIdList(accountIds)) {
        return;
    }

    window.sessionStorage.setItem(
        ACCOUNT_EXPORT_SUCCESS_STORAGE_KEY,
        JSON.stringify(accountIds)
    );
};

export const getAccountExportSuccess = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const accountIds = JSON.parse(
            window.sessionStorage.getItem(ACCOUNT_EXPORT_SUCCESS_STORAGE_KEY) || 'null'
        );

        return isAccountIdList(accountIds) ? accountIds : null;
    } catch {
        return null;
    }
};

export const clearAccountExportSuccess = () => {
    if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(ACCOUNT_EXPORT_SUCCESS_STORAGE_KEY);
    }
};
