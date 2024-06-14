export function keepLastUniqueDataWithProperty<
    ArrayItem extends Required<{ [key in PropertyName]: any }>,
    PropertyName extends string
>(array: ArrayItem[], propertyName: PropertyName): ArrayItem[] {
    const newArray: ArrayItem[] = [];

    array.forEach((arrayItem) => {
        const existingItemIndex = newArray.findIndex(
            (newArrayItem) => newArrayItem[propertyName] === arrayItem[propertyName]
        );

        if (existingItemIndex === -1) {
            newArray.push(arrayItem);
        } else {
            newArray[existingItemIndex] = arrayItem;
        }
    });

    return newArray;
}
