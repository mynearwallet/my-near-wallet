import { BaseStorage } from './BaseStorage';

export class ObjectStorage<DataType> extends BaseStorage<DataType> {
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

    public save(value: DataType): void {
        if (!this.storageKey) {
            throw 'Storage key not defined';
        }

        this.storage.setItem(this.storageKey, JSON.stringify(value));
    }
}
