import * as nearApiJs from 'near-api-js';
import { parseSeedPhrase } from 'near-seed-phrase';

import { listAccountsByPublicKey } from '../services/indexer';

export async function getAccountIds(publicKey) {
    return listAccountsByPublicKey(publicKey);
}

export async function getAccountIdsBySeedPhrase(seedPhrase) {
    const { secretKey } = parseSeedPhrase(seedPhrase);
    const keyPair = nearApiJs.KeyPair.fromString(secretKey);
    const publicKey = keyPair.publicKey.toString();
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
