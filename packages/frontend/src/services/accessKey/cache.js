import Cache from '../../utils/cache';

export class AccessKeyCache extends Cache {
    static STORE_NAME = 'AccessKeyCache';
    static INDEX_NAME = 'PublicKey';

    constructor() {
        super(AccessKeyCache.STORE_NAME, AccessKeyCache.INDEX_NAME);
    }

    getRecord(publicKey) {
        return new Promise(async (resolve, reject) => {
            const store = await this.getIndexStore();
            const query = store.get(publicKey);

            query.onsuccess = (event) => {
                resolve(event.target.result);
            };

            query.onerror = reject;
        });
    }

    addRecord(publicKey, keyMeta) {
        return new Promise(async (resolve, reject) => {
            const store = await this.getObjectStore();

            const item = {
                publicKey,
                keyMeta,
            };

            const request = store.add(item, IDBCursor.primaryKey);
            request.onsuccess = resolve;
            request.onerror = reject;
        });
    }

    async updateRecord(publicKey, keyMeta) {
        const id = await this.getRecord(publicKey).then((record) => record?.id);

        if (!id) {
            return this.addRecord(publicKey, keyMeta);
        }

        return new Promise(async (resolve, reject) => {
            const store = await this.getObjectStore();

            const request = store.put({
                publicKey,
                keyMeta,
                id,
            });

            request.onsuccess = resolve;
            request.onerror = reject;
        });
    }

    getLastRecord() {
        return new Promise(async (resolve) => {
            const store = await this.getObjectStore();

            const request = store.index('Created').openCursor(null, 'prev');

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = () => resolve(undefined);
        });
    }
}

const cache = new AccessKeyCache();
cache.open();

export default cache;
