import { wallet } from '../../../../utils/wallet';

export const deleteAccount = async (accountId: string): Promise<string> => {
    const remaningAccounts = await wallet.removeWalletAccount(accountId);
    const accountIds = Object.keys(remaningAccounts);

    return accountIds.length ? accountIds[0] : '';
};
