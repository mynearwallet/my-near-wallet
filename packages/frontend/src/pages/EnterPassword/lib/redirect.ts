export const getBackUrl = (search: string): string => {
    try {
        const clearSearch = search.slice(1);

        return window.atob(clearSearch);
    } catch (_) {
        return '/';
    }
};
