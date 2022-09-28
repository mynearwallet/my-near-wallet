import { useState } from 'react';

import { useEventListener } from './eventListeners';

export default function useHover(elementRef) {
    const [value, setValue] = useState(false);

    const handleMouseEnter = () => setValue(true);
    const handleMouseLeave = () => setValue(false);

    useEventListener('mouseenter', handleMouseEnter, elementRef);
    useEventListener('mouseleave', handleMouseLeave, elementRef);

    return value;
}
