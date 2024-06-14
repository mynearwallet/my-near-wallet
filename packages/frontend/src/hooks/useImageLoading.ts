import { useEffect, useState } from 'react';

export function useImageLoading({
    imageUrl,
    skip,
    timeout,
}: {
    imageUrl: string;
    skip?: boolean;
    timeout?: number;
}) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isTimeout, setIsTimeout] = useState(false);

    useEffect(() => {
        setIsError(!isLoaded && isTimeout);
    }, [isLoaded, isTimeout]);

    useEffect(() => {
        if (skip) {
            setIsLoaded(true);
            setIsError(false);
            return;
        }
        const timeoutId = setTimeout(() => {
            setIsTimeout(true);
        }, timeout);

        const image = new Image();
        image.onload = () => setIsLoaded(true);
        image.onerror = () => {
            setIsLoaded(true);
            setIsError(true);
        };
        image.src = imageUrl;

        return () => {
            clearTimeout(timeoutId);
            image.onload = null;
            image.onerror = null;
        };
    }, [imageUrl, skip]);

    return { isLoaded, isError };
}
