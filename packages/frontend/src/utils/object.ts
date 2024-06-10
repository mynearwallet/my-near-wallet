import snakeCase from 'lodash.snakeCase';

export function keysToSnakeCase(obj) {
    if (typeof obj === 'object' && obj !== null) {
        const n = {};
        Object.keys(obj).forEach((k) => (n[snakeCase(k)] = obj[k]));
        return n;
    }
    return obj;
}
