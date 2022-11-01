import { useEffect, useRef, useLayoutEffect } from 'react';

export const onKeyDown = (callback) => {
    useEffect(() => {
        document.addEventListener('keydown', callback);

        return () => document.removeEventListener('keydown', callback);
    }, [callback]);
};

export function useListener(eventName, handler, element) {
    const savedHandler = useRef(handler);

    useLayoutEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        const targetElement = element?.current ?? window;

        if (!(targetElement && targetElement.addEventListener)) {
            return;
        }

        const listener = (event) => savedHandler.current(event);

        targetElement.addEventListener(eventName, listener);

        return () => {
            targetElement.removeEventListener(eventName, listener);
        };
    }, [eventName, element]);
}
