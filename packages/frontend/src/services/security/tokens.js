import { TOKEN_BLACKLIST_ENDPOINT } from '../../config';

export async function fetchBlacklistedTokens() {
    try {
        if (!TOKEN_BLACKLIST_ENDPOINT) {
            return [];
        }

        return await fetch(TOKEN_BLACKLIST_ENDPOINT).then((res) => res.json());
    } catch (error) {
        console.error('Error on fetching blacklisted tokens', error);
        return [];
    }
};
