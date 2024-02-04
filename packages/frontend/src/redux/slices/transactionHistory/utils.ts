import { TxDefaultPattern, txPatterns } from './transactionPattern';

export function transactionToHistoryUIData(data, accountId, network) {
    const matchedPattern = txPatterns.find((pattern) => pattern.match(data, network));
    if (matchedPattern) {
        return matchedPattern.display(data, accountId, network);
    }

    const defaultPattern = new TxDefaultPattern();
    return defaultPattern.display(data);
}
