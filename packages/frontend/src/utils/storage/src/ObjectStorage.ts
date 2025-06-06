import { BaseStorage } from './BaseStorage';
import { IRpcConnection } from './ConnectionsStorage';

export abstract class ObjectStorage<DataType> extends BaseStorage<DataType> {
    public load(): DataType {
        if (!this.storageKey) {
            throw 'Storage key not defined';
        }

        try {
            const storedString = this.storage.getItem(this.storageKey);

            if (storedString && this.storageKey === 'connections') {
                // Reset connection cache for users returning to the site from before the default connections selector feature was introduced
                const storedConnections = JSON.parse(storedString) as IRpcConnection[];
                const defaultConnections = this.default as IRpcConnection[];
                // Only reset if stored connections do NOT contain all default connections (legacy users)
                const isLegacy = !defaultConnections.every((def) =>
                    storedConnections.some((conn) => conn.id === def.id)
                );
                if (isLegacy) {
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
