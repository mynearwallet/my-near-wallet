import { useEffect, useState } from 'react';

export default function useDebouncedValue(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value]);

    return debouncedValue;
}
