import { Storable } from '..';

export class BaseStorage<DataType> {
    public default?: DataType;
    protected storageKey?: string;
    private storage: Storable;

    static from<T>(this: new (storage: Storable) => T, storage: Storable): T {
        return new this(storage);
    }

    constructor(storage: Storable) {
        this.storage = storage;
    }

    public load(): DataType {
        if (!this.storageKey) {
            throw 'Storage key not defined';
        }

        try {
            const storedString = this.storage.getItem(this.storageKey);

            if (storedString) {
                return JSON.parse(storedString) as DataType;
            } else {
                return this.default as DataType;
            }
        } catch {
            return this.default as DataType;
        }
    }

    public save(connections: DataType) {
        if (!this.storageKey) {
            throw 'Storage key not defined';
        }

        this.storage.setItem(this.storageKey, JSON.stringify(connections));
    }

    public clear(): void {
        if (!this.storageKey) {
            throw 'Storage key not defined';
        }

        this.storage.removeItem(this.storageKey);
    }
}
