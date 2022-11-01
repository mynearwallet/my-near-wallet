import { MouseEvent } from 'react';

import { useListener } from './eventListeners';

export default function useOnClickOutside(
    ref: {
        current: HTMLElement;
    },
    handler: (event: MouseEvent) => void,
    eventName: 'mousedown' | 'mouseup' = 'mousedown'
): void {
    useListener(eventName, (event) => {
        const element = ref?.current;

        // Do nothing if clicking ref's element or descendent elements
        if (!element || element.contains(event.target)) {
            return;
        }

        handler(event);
    });
}
