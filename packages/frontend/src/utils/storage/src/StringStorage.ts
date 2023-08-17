import { BaseStorage } from './BaseStorage';

export class StringStorage extends BaseStorage<string> {
    public load(): string {
        if (!this.storageKey) {
            throw 'Storage key not defined';
        }

        try {
            const storedString = this.storage.getItem(this.storageKey);

            if (storedString) {
                return storedString as string;
            } else {
                return this.default as string;
            }
        } catch {
            return this.default as string;
        }
    }

    public save(value: string): void {
        if (!this.storageKey) {
            throw 'Storage key not defined';
        }

        this.storage.setItem(this.storageKey, value);
    }
}
