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

interface Coordinate {
    x: number;
    y: number;
}

class LocationStorage extends ObjectStorage<Coordinate> {
    protected readonly storageKey = 'location';
    public default?: Coordinate = { x: 0, y: 0 };
}

test('should return default value', () => {
    const fakeStorage = new FakeStorage();
    const locationStorage = new LocationStorage(fakeStorage);

    expect(locationStorage.load()).toEqual({ x: 0, y: 0 });
});

test('should return stored value', () => {
    const fakeStorage = new FakeStorage();
    const locationStorage = new LocationStorage(fakeStorage);

    fakeStorage.setItem('location', '{"x": 10, "y": 20}');
    expect(locationStorage.load()).toEqual({ x: 10, y: 20 });
});

test('should store value', () => {
    const fakeStorage = new FakeStorage();
    const locationStorage = new LocationStorage(fakeStorage);

    locationStorage.save({ x: 10, y: 20 });
    expect(fakeStorage.getItem('location')).toBe('{"x":10,"y":20}');
});

test('should remove value', () => {
    const fakeStorage = new FakeStorage();
    const locationStorage = new LocationStorage(fakeStorage);

    fakeStorage.setItem('location', '{"x": 10, "y": 20}');
    locationStorage.clear();
    expect(fakeStorage.getItem('location')).toBeNull();
});

test('should throw error when default value is not defined', () => {
    class LocationStorageWithoutDefaults extends ObjectStorage<Coordinate> {
        protected readonly storageKey = 'location';
    }

    const fakeStorage = new FakeStorage();
    const locationStorage = new LocationStorageWithoutDefaults(fakeStorage);

    locationStorage.save({ x: 10, y: 20 });
    expect(locationStorage.load()).toEqual({ x: 10, y: 20 });

    locationStorage.clear();
    expect(() => locationStorage.load()).toThrow('No default value');
});
