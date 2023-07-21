import { EncryptionDecryptionUtils } from './encryptionUtils';
import { getPasswordHash } from './passwordHash';

const KEY_STORE_PREFIX = '_4:';
const LOCAL_STORAGE_WALLET_DATA_KEY = 'MNW_WALLET_DATA';

export enum EWalletDataError {
    BAD_PASSWORD = 'BAD_PASSWORD',
    NO_PASSWORD_PROVIDED_TO_UNLOCK = 'NO_PASSWORD_PROVIDED_TO_UNLOCK',
    UNLOCKED_DATA_NOT_FOUND = 'UNLOCKED_DATA_NOT_FOUND',
}

export interface IDecryptedAccount {
    accountId: string;
    privateKey: string;
    seedPhrase?: string;
}

export const retrieveAllAccountsPrivateKey = (): IDecryptedAccount[] => {
    const items: IDecryptedAccount[] = [];

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

export interface ISensitiveData {
    decryptCheck: boolean;
    version: string;
    accounts: IDecryptedAccount[];
}

export interface IStoredWalletData {
    encryptedData?: {
        payload: string;
        salt: string;
    };
    timeRefusedEncryption?: number;
}

const memoryOnlyWalletData: {
    mem: {
        unlockedData?: {
            passwordHash: string;
            decryptedData: ISensitiveData;
        };
        hasEncryptedData?: boolean;
        timeRefusedEncryption?: number;
    };
} = {
    mem: {},
};

function createSensitiveDataObject(accounts: IDecryptedAccount[]): ISensitiveData {
    return {
        accounts,
        decryptCheck: true,
        version: '1',
    };
}

export function initializeStoredWalletData() {
    const storedWalletData = getStoredWalletData();

    if (storedWalletData == null) {
        const newStoredWalletData: IStoredWalletData = {};
        setStoredWalletData(newStoredWalletData);

        memoryOnlyWalletData.mem = {
            hasEncryptedData: false,
        };
    } else {
        if (storedWalletData.encryptedData != null) {
            memoryOnlyWalletData.mem = {
                hasEncryptedData: true,
            };
        } else {
            memoryOnlyWalletData.mem = {
                hasEncryptedData: false,
                timeRefusedEncryption: storedWalletData.timeRefusedEncryption,
            };
        }
    }
}

const setStoredWalletData = (walletData: IStoredWalletData) => {
    localStorage.setItem(LOCAL_STORAGE_WALLET_DATA_KEY, JSON.stringify(walletData));
};

const getStoredWalletData = (): IStoredWalletData | null => {
    const storedString = localStorage.getItem(LOCAL_STORAGE_WALLET_DATA_KEY);

    if (storedString == null) {
        return null;
    }

    return JSON.parse(storedString);
};

async function encryptAndSetData(passwordHash: string, sensitiveData: ISensitiveData) {
    const encryptedData = await EncryptionDecryptionUtils.encrypt(
        passwordHash,
        sensitiveData
    );

    setStoredWalletData({
        encryptedData,
    });

    memoryOnlyWalletData.mem = {
        unlockedData: {
            passwordHash,
            decryptedData: sensitiveData,
        },
        hasEncryptedData: true,
    };
}

/*
   --------------------------
   STORED WALLET DATA ACTIONS
*  --------------------------
*/

export type TStoredWalletDataStatus =
    | {
          hasEncryptedData: true;
          hasRefusedEncryption: false;
          secondsSinceRefusedEncryption?: undefined;
      }
    | {
          hasEncryptedData: false;
          hasRefusedEncryption: false;
          secondsSinceRefusedEncryption?: undefined;
      }
    | {
          hasEncryptedData: false;
          hasRefusedEncryption: true;
          secondsSinceRefusedEncryption: number;
      };

function getStoredWalletDataStatus(): TStoredWalletDataStatus {
    if (memoryOnlyWalletData.mem.hasEncryptedData === undefined) {
        initializeStoredWalletData();
    }

    if (memoryOnlyWalletData.mem.hasEncryptedData) {
        return {
            hasEncryptedData: true,
            hasRefusedEncryption: false,
        };
    }

    if (memoryOnlyWalletData.mem.timeRefusedEncryption === undefined) {
        return {
            hasEncryptedData: false,
            hasRefusedEncryption: false,
        };
    }

    const secondsSinceRefusedEncryption = Math.floor(
        (Date.now() - memoryOnlyWalletData.mem.timeRefusedEncryption) / 1000
    );

    return {
        hasEncryptedData: false,
        hasRefusedEncryption: true,
        secondsSinceRefusedEncryption,
    };
}

interface IOSetEncryptedData_Input {
    password: string;
    accounts: IDecryptedAccount[];
}

async function setNewEncryptedData({ accounts, password }: IOSetEncryptedData_Input) {
    const passwordHash = await getPasswordHash(password);
    const sensitiveData = createSensitiveDataObject(accounts);
    await encryptAndSetData(passwordHash, sensitiveData);
}

async function updateEncryptedData({ accounts }: IOSetEncryptedData_Input) {
    if (memoryOnlyWalletData.mem.unlockedData == null) {
        throw new Error(EWalletDataError.UNLOCKED_DATA_NOT_FOUND);
    }

    const sensitiveData = createSensitiveDataObject(accounts);
    await encryptAndSetData(
        memoryOnlyWalletData.mem.unlockedData.passwordHash,
        sensitiveData
    );
}

async function getEncryptedData(password?: string): Promise<ISensitiveData> {
    if (memoryOnlyWalletData.mem.unlockedData == null) {
        if (password == null) {
            throw new Error(EWalletDataError.NO_PASSWORD_PROVIDED_TO_UNLOCK);
        }

        const passwordHash = await getPasswordHash(password);

        const storedWalletData = getStoredWalletData();

        let sensitiveData: ISensitiveData;

        try {
            sensitiveData = await EncryptionDecryptionUtils.decrypt<ISensitiveData>(
                passwordHash,
                storedWalletData.encryptedData.salt,
                storedWalletData.encryptedData.payload
            );
        } catch (e) {
            console.error(e);
            throw new Error(EWalletDataError.BAD_PASSWORD);
        }

        if (!sensitiveData.decryptCheck) {
            throw new Error(EWalletDataError.BAD_PASSWORD);
        }

        memoryOnlyWalletData.mem.unlockedData = {
            passwordHash,
            decryptedData: sensitiveData,
        };
    }

    return memoryOnlyWalletData.mem.unlockedData.decryptedData;
}

async function isPasswordGood(password): Promise<boolean> {
    if (memoryOnlyWalletData.mem.unlockedData != null) {
        const passwordHash = await getPasswordHash(password);
        return passwordHash === memoryOnlyWalletData.mem.unlockedData.passwordHash;
    }

    try {
        await getEncryptedData(password);
        return true;
    } catch (e) {
        if (e.message === EWalletDataError.BAD_PASSWORD) {
            return false;
        }

        throw e;
    }
}

async function changePassword(oldPassword, newPassword) {
    if (await isPasswordGood(oldPassword)) {
        const encryptedData = await getEncryptedData(oldPassword);
        await setNewEncryptedData({
            accounts: encryptedData.accounts,
            password: newPassword,
        });
    } else {
        throw new Error(EWalletDataError.BAD_PASSWORD);
    }
}

function removeEncryptedData() {
    setStoredWalletData({});
    memoryOnlyWalletData.mem = {
        hasEncryptedData: false,
    };
}

export const storedWalletDataActions = {
    initializeStoredWalletData,
    setNewEncryptedData,
    updateEncryptedData,
    getEncryptedData,
    isPasswordGood,
    changePassword,
    getStatus: getStoredWalletDataStatus,
    removeEncryptedData,
};
