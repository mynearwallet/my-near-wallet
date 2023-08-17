import { Storable } from '..';

export abstract class BaseStorage<DataType> {
    public default?: DataType;
    protected storageKey?: string;
    protected storage: Storable;

    static from<T>(this: new (storage: Storable) => T, storage: Storable): T {
        return new this(storage);
    }

    constructor(storage: Storable) {
        this.storage = storage;
    }

    public abstract load(): DataType;
    public abstract save(connections: DataType);

    public clear(): void {
        if (!this.storageKey) {
            throw 'Storage key not defined';
        }

        this.storage.removeItem(this.storageKey);
    }
}
