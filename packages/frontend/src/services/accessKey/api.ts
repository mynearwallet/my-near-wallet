import CONFIG from '../../config';
import { AccessKeyCache } from './cache';

export async function getAccessKeyMeta(accessKeys, accountId) {
    const accessKeysWithMetadata = accessKeys.map((key) => ({ ...key }));

    const accessKeyCache = new AccessKeyCache();
    await accessKeyCache.open();

    try {
        let pageCount = 1;
        let response;

        const lastRecord = await accessKeyCache.getLastRecord();

        do {
            response = await fetch(
                `${
                    CONFIG.INDEXER_NEARBLOCK_SERVICE_URL
                }/v1/account/${accountId}/keys?page=${pageCount++}&per_page=25&order=desc`
            ).then((res) => res.json());

            await Promise.all(
                response?.keys?.map((keyInfo) =>
                    accessKeyCache
                        .updateRecord(keyInfo.public_key, keyInfo.created)
                        .catch((err) => {
                            console.error('save access key record error', err);
                        })
                )
            );
        } while (
            response?.keys?.length === 25 &&
            response?.keys?.filter(
                (key) => key.public_key === lastRecord?.value?.publicKey
            ).length === 0
        );
    } catch (err) {
        console.error('fetch access key from nearblocks error', err);
        // Even with error, we don't want to stop the process, we try to fetch old value from cache
    }

    await Promise.all(
        accessKeysWithMetadata.map((key) =>
            accessKeyCache
                .getRecord(key.public_key)
                .then((record) => (key.created = record?.keyMeta))
                .catch((err) => console.error('get access key record error', err))
        )
    );

    return accessKeysWithMetadata;
}
