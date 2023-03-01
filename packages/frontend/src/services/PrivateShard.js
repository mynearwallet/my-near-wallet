const createError = require('http-errors');

const CALIMERO_BASE_URL = 'http://localhost:3000';
const CALIMERO_SYNC_ACCOUNT_URL = `${CALIMERO_BASE_URL}/api/public/sync`;

export async function syncPrivateShardAccount(json) {
    const response = await fetch(CALIMERO_SYNC_ACCOUNT_URL, {
        method: 'POST',
        body: JSON.stringify(json),
        headers: {
            'Content-type': 'application/json; charset=utf-8',
        }
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
};
