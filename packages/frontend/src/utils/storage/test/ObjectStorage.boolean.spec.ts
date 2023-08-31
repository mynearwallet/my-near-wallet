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

class TutorialStorage extends ObjectStorage<boolean> {
    protected readonly storageKey = 'tutorial';
    public default?: boolean = true;
}

test('should return default value', () => {
    const fakeStorage = new FakeStorage();
    const tutorialStorage = new TutorialStorage(fakeStorage);

    expect(tutorialStorage.load()).toBe(true);
});

test('should return stored value', () => {
    const fakeStorage = new FakeStorage();
    const tutorialStorage = new TutorialStorage(fakeStorage);

    fakeStorage.setItem('tutorial', 'false');
    expect(tutorialStorage.load()).toBe(false);
});

test('should store value', () => {
    const fakeStorage = new FakeStorage();
    const tutorialStorage = new TutorialStorage(fakeStorage);

    tutorialStorage.save(false);
    expect(fakeStorage.getItem('tutorial')).toBe('false');
});

test('should remove value', () => {
    const fakeStorage = new FakeStorage();
    const tutorialStorage = new TutorialStorage(fakeStorage);

    fakeStorage.setItem('tutorial', 'false');
    tutorialStorage.clear();
    expect(fakeStorage.getItem('tutorial')).toBeNull();
});

test('should throw error when default value is not defined', () => {
    class TutorialStorageWithoutDefaults extends ObjectStorage<boolean> {
        protected readonly storageKey = 'tutorial';
    }

    const fakeStorage = new FakeStorage();
    const tutorialStorage = new TutorialStorageWithoutDefaults(fakeStorage);

    tutorialStorage.save(false);
    expect(tutorialStorage.load()).toBe(false);

    tutorialStorage.clear();
    expect(() => tutorialStorage.load()).toThrow('No default value');
});
