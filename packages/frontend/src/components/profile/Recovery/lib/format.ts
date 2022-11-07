export const formatCreatedAt = (date: string): string =>
    new Date(date).toDateString().replace(/^\S+\s/,'');
