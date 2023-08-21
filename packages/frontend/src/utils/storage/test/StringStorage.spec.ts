import { expect, test } from '@jest/globals';

import { StringStorage } from '../src/StringStorage';
import { Storable } from '../src/type';

class FakeStorage implements Storable {
    private data: Record<string, string> = {};

    public getItem(key: string): string | null {
        return this.data[key] || null;
    }

    public setItem(key: string, value: string): void {
        this.data[key] = value;
    }

    public removeItem(key: string): void {
        delete this.data[key];
    }
}

class NameStorage extends StringStorage {
    public default: string = 'John Doe';
    protected storageKey: string = 'name';
}

test('should return default value', () => {
    const fakeStorage = new FakeStorage();
    const nameStorage = new NameStorage(fakeStorage);

    expect(nameStorage.load()).toBe('John Doe');
});

test('should return stored value', () => {
    const fakeStorage = new FakeStorage();
    const nameStorage = new NameStorage(fakeStorage);

    fakeStorage.setItem('name', 'Jane Doe');
    expect(nameStorage.load()).toBe('Jane Doe');
});

test('should store value', () => {
    const fakeStorage = new FakeStorage();
    const nameStorage = new NameStorage(fakeStorage);

    nameStorage.save('Jane Doe');
    expect(fakeStorage.getItem('name')).toBe('Jane Doe');
});

test('should remove value', () => {
    const fakeStorage = new FakeStorage();
    const nameStorage = new NameStorage(fakeStorage);

    fakeStorage.setItem('name', 'Jane Doe');
    nameStorage.clear();
    expect(fakeStorage.getItem('name')).toBeNull();
});

test('should throw error when default value is not defined', () => {
    class NameStorageWithoutDefaults extends StringStorage {
        protected storageKey: string = 'name';
    }

    const fakeStorage = new FakeStorage();
    const nameStorage = new NameStorageWithoutDefaults(fakeStorage);

    nameStorage.save('Jane Doe');
    expect(nameStorage.load()).toBe('Jane Doe');

    nameStorage.clear();
    expect(() => nameStorage.load()).toThrow('No default value');
});
