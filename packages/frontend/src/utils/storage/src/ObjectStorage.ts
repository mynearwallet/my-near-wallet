import { BaseStorage } from './BaseStorage';
import { RpcConnection } from './ConnectionsStorage';

export abstract class ObjectStorage<DataType> extends BaseStorage<DataType> {
    public load(): DataType {
        if (!this.storageKey) {
            throw 'Storage key not defined';
        }

        try {
            const storedString = this.storage.getItem(this.storageKey);

            if (storedString && this.storageKey === 'connections') {
                // reset connection cache when there is update
                const storedConnections = JSON.parse(storedString) as RpcConnection[];
                if (
                    storedConnections.length !== (this.default as RpcConnection[]).length
                ) {
                    return this.default;
                }
                return storedConnections as DataType;
            } else if (storedString) {
                return JSON.parse(storedString) as DataType;
            }
        } catch {
            // do nothing
        }

        if (this.default) {
            return this.default as DataType;
        } else {
            throw 'No default value';
        }
    }

    public save(value: DataType): void {
        if (!this.storageKey) {
            throw 'Storage key not defined';
        }

        this.storage.setItem(this.storageKey, JSON.stringify(value));
    }
}
