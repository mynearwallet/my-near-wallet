import nacl from 'tweetnacl';
import { encodeUTF8, decodeUTF8, encodeBase64, decodeBase64 } from 'tweetnacl-util';

import CONFIG from '../config';
import {
    ISensitiveData,
    IDecryptedAccount,
    storedWalletDataActions,
} from './encryptedWalletData';
import { wallet } from './wallet';

export enum EEncryptionMethod {
    nearWalletSelectorAccountExport = 'nearWalletSelectorAccountExport',
    jsonStringify = 'jsonStringify',
}

export interface IEncryptedAccounts {
    encryptionMethod?: EEncryptionMethod;
    encryptionSalt?: string;
    payload: string;
}

export interface IUserPreferences {
    [key: string]: string;
}

export interface IDataMigration {
    exportFrom?: string;
    version?: number;
    accounts: IEncryptedAccounts;
    userPreferences?: IUserPreferences;
}

export const EXPORTER_NAME: string = 'my-near-wallet';
export const EXPORTER_VERSION: number = 1;

export const generateSecretKey = (): string => {
    const random = nacl.randomBytes(24);
    return encodeBase64(random);
};

export async function exportData(secretKey: string): Promise<string> {
    const sensitiveData: ISensitiveData =
        await storedWalletDataActions.getEncryptedData();

    const decryptedAccounts: IDecryptedAccount[] = sensitiveData.accounts;

    const accounts: IEncryptedAccounts = encryptAccounts(
        decryptedAccounts,
        EEncryptionMethod.nearWalletSelectorAccountExport,
        secretKey
    );

    const exportedData: IDataMigration = {
        exportFrom: EXPORTER_NAME,
        version: EXPORTER_VERSION,
        accounts,
        userPreferences: [
            'languageCode',
            '_4:wallet:accounts_v2',
            '_4:wallet:active_account_id_v2',
        ].reduce((object: IUserPreferences, key) => {
            object[key] = localStorage.getItem(key);
            return object;
        }, {}),
    };

    return JSON.stringify(exportedData);
}

export async function importData(exportString: string, secretKey: string): Promise<void> {
    let exportedDataJson: IDataMigration | null = null;

    try {
        exportedDataJson = JSON.parse(exportString) as IDataMigration;
    } catch (err) {
        console.log(err);
    }

    const exportedData: IDataMigration = exportedDataJson || {
        accounts: {
            encryptionMethod: EEncryptionMethod.nearWalletSelectorAccountExport,
            payload: exportString,
        },
    };

    const accounts: IDecryptedAccount[] = decryptAccounts(
        exportedData.accounts.payload,
        exportedData.accounts.encryptionMethod,
        secretKey,
        exportedData.accounts.encryptionSalt
    );

    const recoverAccountPromises: Promise<any>[] = accounts.map(
        (account: IDecryptedAccount) =>
            wallet.recoverAccountSecretKey(account.privateKey, account.accountId)
    );

    // batch all recovery at once to save time
    await Promise.all(recoverAccountPromises);

    if (exportedData.userPreferences) {
        for (const [key, value] of Object.entries(exportedData.userPreferences)) {
            localStorage.setItem(key, value);
        }
    }
}

function encryptAccounts(
    accounts: IDecryptedAccount[],
    method: EEncryptionMethod,
    secretKey: string = '',
    salt: string = ''
): IEncryptedAccounts {
    const encryptedAccounts: IEncryptedAccounts = {
        encryptionMethod: method,
        encryptionSalt: salt,
        payload: '',
    };

    switch (method) {
        case EEncryptionMethod.nearWalletSelectorAccountExport:
            if (!secretKey) {
                throw new Error('Secret key is required');
            }

            try {
                const keyUint8Array = decodeBase64(
                    Buffer.from(secretKey).toString('base64')
                );
                const messageUint8Array = decodeUTF8(JSON.stringify(accounts));
                const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
                const box = nacl.secretbox(messageUint8Array, nonce, keyUint8Array);
                const fullMessage = new Uint8Array(nonce.length + box.length);
                fullMessage.set(nonce);
                fullMessage.set(box, nonce.length);

                encryptedAccounts.payload = encodeBase64(fullMessage);
            } catch (e) {
                throw new Error('Unable to encrypt account data');
            }
            break;
        case EEncryptionMethod.jsonStringify:
            if (CONFIG.IS_MAINNET) {
                throw new Error(
                    'Do not use jsonStringify method to secure main net accounts'
                );
            }

            encryptedAccounts.payload = JSON.stringify(accounts);
            break;
    }

    return encryptedAccounts;
}

function decryptAccounts(
    accountsPayload: string,
    method: EEncryptionMethod,
    secretKey: string = '',
    salt: string = '' // eslint-disable-line
): IDecryptedAccount[] {
    const accounts: IDecryptedAccount[] = [];

    switch (method) {
        case EEncryptionMethod.nearWalletSelectorAccountExport:
            if (!secretKey) {
                throw new Error('Secret key is required');
            }
            try {
                const keyUint8Array = decodeBase64(
                    Buffer.from(secretKey).toString('base64')
                );
                const messageWithNonceAsUint8Array = decodeBase64(accountsPayload);
                const nonce = messageWithNonceAsUint8Array.slice(
                    0,
                    nacl.secretbox.nonceLength
                );
                const message = messageWithNonceAsUint8Array.slice(
                    nacl.secretbox.nonceLength,
                    accountsPayload.length
                );
                const decrypted = nacl.secretbox.open(message, nonce, keyUint8Array);
                if (!decrypted) {
                    throw new Error('Unable to decrypt account data');
                }
                const base64DecryptedMessage = encodeUTF8(decrypted);
                JSON.parse(base64DecryptedMessage).forEach((account) =>
                    accounts.push(account)
                );
            } catch {
                throw new Error('Unable to decrypt account data');
            }
            break;
        case EEncryptionMethod.jsonStringify:
            try {
                JSON.parse(accountsPayload).forEach((account) => accounts.push(account));
            } catch {
                throw new Error('Unable to decrypt account data');
            }
            break;
    }

    return accounts;
}
