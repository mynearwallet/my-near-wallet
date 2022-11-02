import { IMPLICIT_ACCOUNT_MAX_LENGTH } from './constants';
import { KEY_ACTIVE_ACCOUNT_ID } from './wallet';

export const validateEmail = (email) => {
    /* Checks for anystring@anystring.anystring */
    let re = /\S+@\S+\.\S+/;
    return re.test(email);
};

export const isImplicitAccount = (accountId) =>
    accountId && accountId.length === IMPLICIT_ACCOUNT_MAX_LENGTH && !accountId.includes('.');

const ACCOUNT_ID_SEPARATOR = '...';

export const shortenAccountId = (id, startChars = 8, endChars = 8) => {
    const numOfRemainingChars = startChars + endChars + ACCOUNT_ID_SEPARATOR.length;
    const isOutOfScope = id.length < numOfRemainingChars || numOfRemainingChars > IMPLICIT_ACCOUNT_MAX_LENGTH;
    const isInvalidCharCount = startChars < 1 || endChars < 1;

    if (!isImplicitAccount(id) || isOutOfScope || isInvalidCharCount) {
        return id;
    }

    return `${id.slice(0, startChars)}${ACCOUNT_ID_SEPARATOR}${id.slice(id.length - endChars)}`;
};

export const getActiveAccountId = () =>
    localStorage.getItem(KEY_ACTIVE_ACCOUNT_ID);
