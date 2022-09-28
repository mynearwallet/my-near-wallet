import { useEffect, useRef, useLayoutEffect } from 'react';

export const onKeyDown = (callback) => {
    useEffect(() => {
        document.addEventListener('keydown', callback);
        return () => document.removeEventListener('keydown', callback);
    }, [callback]);
};

export const useEventListener = (eventName, handler, element, options) => {
    const savedHandler = useRef(handler);

    useLayoutEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        const targetElement = element?.current || window;

        if (!(targetElement && targetElement.addEventListener)) {
            return;
        }

        const eventListener = (event) => {
            if (typeof savedHandler.current === 'function') {
                savedHandler.current(event);
            }
        };

        targetElement.addEventListener(eventName, eventListener, options);

        return () => {
            targetElement.removeEventListener(eventName, eventListener);
        };
    }, [eventName, element, options]);
};
