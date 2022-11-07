import { wallet } from '../../../utils/wallet';

export const removeAllAccounts = async (accounts: string[]): Promise<void> => {
    for (let i = 0; i <= accounts.length; i++) {
        await wallet.removeWalletAccount(accounts[i]);
    }
};
