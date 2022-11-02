import { wallet } from '../../../../utils/wallet';

export const encryptWallet = (password: string): void => {
    wallet.injectEncryptedKeyStore(password);
};
