import CONFIG from '../../config';
import { wallet } from '../../utils/wallet';

export const MAX_EXPORTABLE_ACCOUNTS = 30;

export const loadExportableAccounts = async () => {
    const accountIds = await wallet.keyStore.getAccounts(CONFIG.NETWORK_ID);

    return Promise.all(
        accountIds.map(async (accountId) => {
            try {
                const keyPair = await wallet.getLocalKeyPair(accountId);
                const hasFullAccessKey =
                    keyPair != null && (await wallet.isFullAccessKey(accountId, keyPair));

                return {
                    accountId,
                    availability: hasFullAccessKey ? 'available' : 'not_full_access',
                };
            } catch {
                return { accountId, availability: 'verification_failed' };
            }
        })
    );
};
