import { wallet } from './wallet';

export async function getTransactions({ accountId }) {
    if (!accountId) {
        return {};
    }
    return {};
}

export const transactionExtraInfo = ({ hash, signer_id }) =>
    wallet.connection.provider.sendJsonRpc('tx', [hash, signer_id]);
