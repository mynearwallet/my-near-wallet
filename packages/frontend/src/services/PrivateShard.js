import CONFIG from '../config';
import createError from 'http-errors';

export async function syncPrivateShardAccount(json) {
    const response = await fetch(`${CONFIG.CALIMERO_URL}/api/public/sync`, {
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
