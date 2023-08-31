import { BaseStorage } from './BaseStorage';

export abstract class StringStorage extends BaseStorage<string> {
    public load(): string {
        if (!this.storageKey) {
            throw 'Storage key not defined';
        }

        const storedString = this.storage.getItem(this.storageKey);

        if (storedString) {
            return storedString as string;
        } else if (this.default) {
            return this.default as string;
        } else {
            throw 'No default value';
        }
    }

    public save(value: string): void {
        if (!this.storageKey) {
            throw 'Storage key not defined';
        }

        this.storage.setItem(this.storageKey, value);
    }
}
