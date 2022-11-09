export const getBackUrl = (search: string): string => {
    try {
        const clearSearch = search.slice(1);

        return decodeURIComponent(clearSearch) || '/';
    } catch (_) {
        return '/';
    }
};
