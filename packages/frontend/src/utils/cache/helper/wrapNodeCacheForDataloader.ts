import Cache from 'node-cache';

type Key = string | number;

function checkExtraParams(extraParams: any[]) {
    if (extraParams.length > 0) {
        console.warn('Unknown extra params', extraParams);
    }
}

export function wrapNodeCacheForDataloader(cache: Cache) {
    return {
        get: <T>(key: Key, ...extraParams: any[]): T | undefined => {
            checkExtraParams(extraParams);

            return cache.get<T>(key);
        },

        set: <T>(
            key: Key,
            value: T,
            ttl: number | string = cache.options.stdTTL,
            ...extraParams: any[]
        ): boolean => {
            checkExtraParams(extraParams);

            return cache.set<T>(key, value, ttl);
        },

        delete: (keys: Key | Key[], ...extraParams: any[]): number => {
            checkExtraParams(extraParams);

            return cache.del(keys);
        },

        clear: (...extraParams: any[]): void => {
            checkExtraParams(extraParams);

            return cache.flushAll();
        },
    };
}
