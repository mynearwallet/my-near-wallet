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
