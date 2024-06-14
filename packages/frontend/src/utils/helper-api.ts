import * as nearApiJs from 'near-api-js';
import { parseSeedPhrase } from 'near-seed-phrase';

import CONFIG from '../config';
import { CoreIndexerAdapter } from '../services/coreIndexer/CoreIndexerAdapter';

export async function getAccountIds(publicKey, waitAllIndexer?:boolean) {
    const coreIndexerAdapter = CoreIndexerAdapter.getInstance(CONFIG.CURRENT_NEAR_NETWORK);
    return await coreIndexerAdapter.fetchAccountIdsByPublicKeyFromAllIndexers(publicKey, waitAllIndexer);
}

export async function getAccountIdsBySeedPhrase(seedPhrase) {
    const { secretKey } = parseSeedPhrase(seedPhrase);
    const keyPair = nearApiJs.KeyPair.fromString(secretKey);
    const publicKey = keyPair.getPublicKey().toString();
    return getAccountIds(publicKey);
}

export function isUrlNotJavascriptProtocol(url) {
    if (!url) {
        return true;
    }
    try {
        const urlProtocol = new URL(url).protocol;
        if (urlProtocol === 'javascript:') {
            console.log(
                'Invalid URL protocol:',
                urlProtocol,
                'URL cannot execute JavaScript'
            );
            return false;
        }
        return true;
    } catch (error) {
        return false;
    }
}
