import nacl from 'tweetnacl';
import { decodeUTF8, encodeBase64, decodeBase64 } from 'tweetnacl-util';

import CONFIG from '../config';
import {
    ISensitiveData,
    IDecryptedAccount,
    storedWalletDataActions,
} from './encryptedWalletData';

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

export async function exportData(secretKey: string): Promise<string> {
    // const { storedWalletDataActions } = await import('./encryptedWalletData');

    const sensitiveData: ISensitiveData =
        await storedWalletDataActions.getEncryptedData();

    const decryptedAccounts: IDecryptedAccount[] = sensitiveData.accounts;

    const accounts: IEncryptedAccounts = encryptAccounts(
        decryptedAccounts,
        // EEncryptionMethod.nearWalletSelectorAccountExport,
        EEncryptionMethod.jsonStringify,
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

export function importData(exportString: string): void {
    // TODO: importData
    console.log(exportString);
}

function encryptAccounts(
    accounts: IDecryptedAccount[],
    method: EEncryptionMethod,
    secretKey: string = '',
    salt: string = ''
): IEncryptedAccounts {
    let payload;

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

                payload = encodeBase64(fullMessage);
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

            payload = JSON.stringify(accounts);
            break;
    }

    return {
        encryptionMethod: method,
        encryptionSalt: salt,
        payload,
    };
}

export const generateSecretKey = (): string => {
    const random = nacl.randomBytes(24);
    return encodeBase64(random);
};
