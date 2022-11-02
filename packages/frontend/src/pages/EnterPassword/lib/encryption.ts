import { wallet } from '../../../utils/wallet';

export const decryptWallet = (password: string): void => {
    wallet.injectEncryptedKeyStore(password);
};

