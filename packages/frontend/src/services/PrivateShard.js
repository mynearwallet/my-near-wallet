import createError from 'http-errors';

import CONFIG from '../config';

export async function syncPrivateShardAccount({
    accountId,
    publicKey,
    signature,
    shardInfo,
}) {
    const postData = {
        accountId,
        publicKey,
        signature,
        shardId: shardInfo.shardId,
        method: 'sync',
    };
    const response = await fetch(`${CONFIG.CALIMERO_API_URL}/api/v1/shards/${shardInfo.shardId}/wallet/api/v1/account/sync`, {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: {
            'Content-type': 'application/json; charset=utf-8',
            'x-api-key': shardInfo.shardApiToken
        },
    });
    if (!response.ok) {
        const body = await response.text();
        let parsedBody;

        try {
            parsedBody = JSON.parse(body);
        } catch (e) {
            throw createError(response.status, body);
        }

        throw createError(response.status, parsedBody);
    }
    return await response.json();
}
