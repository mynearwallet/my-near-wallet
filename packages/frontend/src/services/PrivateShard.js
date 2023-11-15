import createError from 'http-errors';

import CONFIG from '../config';

export async function syncPrivateShardAccount({ accountId, shardInfo }) {
    const postData = {
        accountId,
        shardId: shardInfo.shardId,
    };
    const response = await fetch(`${CONFIG.CALIMERO_URL}/api/public/sync`, {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: {
            'Content-type': 'application/json; charset=utf-8',
            'x-signature': shardInfo.xSignature,
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

export async function fetchChallenge() {
    const response = await fetch(`${CONFIG.CALIMERO_URL}/api/public/challenge`, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json; charset=utf-8',
        },
    });
    console.log(response);
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
