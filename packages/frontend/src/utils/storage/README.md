# Storage

`ObjectStorage<DataType>` and `StringStorage` are useful to store and read values to and from any storage mechanism that implements `Storable` interface, such as `localStorage`.

## Usage

### For string value

```typescript
// Extends the StringStorage
class NameStorage extends StringStorage {
    // The key for store and read data
    protected storageKey: string = "name";
    
    // Optionally provide a default value
    public default: string = "World"; 
}

const nameStorage = NameStorage.from(localStorage);

console.log(`Hello ${nameStorage.load()}!`);
// Hello World!

nameStorage.save('John');

console.log(`Hello ${nameStorage.load()}!`);
// Hello John!
```

### For boolean value

```typescript
// Extends the ObjectStorage
class TutorialStorage extends ObjectStorage<boolean> {
    // The key for store and read data
    protected storageKey: string = 'tutorial';
    
    // Optionally provide a default value
    public default?: boolean = true;
}

const tutorialStorage = new TutorialStorageWithoutDefaults(localStorage);

console.log(tutorialStorage.load());
// true

tutorialStorage.save(false);

console.log(tutorialStorage.load());
// false
```

### For number value

```typescript
// Extends the ObjectStorage
class AgeStorage extends ObjectStorage<number> {
    // The key for store and read data
    protected storageKey: string = 'age';
    
    // Optionally provide a default value
    public default?: number = 18;
}

const ageStorage = new AgeStorage(localStorage);

console.log(ageStorage.load());
// 18

ageStorage.save(20);

console.log(ageStorage.load());
// 20
```

### For object value

```typescript
interface Coordinate {
    x: number,
    y: number
}

// Extends the ObjectStorage
class LocationStorage extends ObjectStorage<Coordinate> {
    // The key for store and read data
    protected storageKey: string = "location";
    
    // Optionally provide a default value
    public default: Coordinate = { x: 1, y: 2 }; 
}

const locationStorage = LocationStorage.from(localStorage);

console.log(locationStorage.load());
// { x: 1, y: 2 }

nameStorage.save({ x: 3, y: 4 });

console.log(locationStorage.load());
// { x: 3, y: 4 }
```

## Testing

- Before you begin, make sure you have jest installed. `npm install -g jest`

- First, go to the frontend folder. `cd packages/frontend`

- Then, use this script to test: `jest ./src/utils/storage`