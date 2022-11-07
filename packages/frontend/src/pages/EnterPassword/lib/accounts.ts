import { wallet } from '../../../utils/wallet';

export const removeAllAccounts = async (): Promise<void> => {
    const accounts = wallet.getAccountsLocalStorage();

    for (let accountId in accounts) {
        await wallet.removeWalletAccount(accountId);
    }

    // todo какие-то записи остались, стёрлось не всё
};
