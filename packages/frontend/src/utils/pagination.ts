export function convertPageToOffset(page, pageSize) {
    if (page < 1 || pageSize <= 0) {
        return 0;
    }

    const offset = (page - 1) * pageSize;
    return offset;
}

export const utils_pagination = {
    convertPageToOffset,
};
