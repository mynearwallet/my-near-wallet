import { expect, test } from '@jest/globals';

import { ObjectStorage } from '../src/ObjectStorage';
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

class AgeStorage extends ObjectStorage<number> {
    protected readonly storageKey = 'age';
    public default?: number = 18;
}

test('should return default value', () => {
    const fakeStorage = new FakeStorage();
    const ageStorage = new AgeStorage(fakeStorage);

    expect(ageStorage.load()).toBe(18);
});

test('should return stored value', () => {
    const fakeStorage = new FakeStorage();
    const ageStorage = new AgeStorage(fakeStorage);

    fakeStorage.setItem('age', '20');
    expect(ageStorage.load()).toBe(20);
});

test('should store value', () => {
    const fakeStorage = new FakeStorage();
    const ageStorage = new AgeStorage(fakeStorage);

    ageStorage.save(20);
    expect(fakeStorage.getItem('age')).toBe('20');
});

test('should remove value', () => {
    const fakeStorage = new FakeStorage();
    const ageStorage = new AgeStorage(fakeStorage);

    fakeStorage.setItem('age', '20');
    ageStorage.clear();
    expect(fakeStorage.getItem('age')).toBeNull();
});

test('should throw error when default value is not defined', () => {
    class AgeStorageWithoutDefaults extends ObjectStorage<number> {
        protected readonly storageKey = 'age';
    }

    const fakeStorage = new FakeStorage();
    const ageStorage = new AgeStorageWithoutDefaults(fakeStorage);

    ageStorage.save(20);
    expect(ageStorage.load()).toBe(20);

    ageStorage.clear();
    expect(() => ageStorage.load()).toThrow('No default value');
});
