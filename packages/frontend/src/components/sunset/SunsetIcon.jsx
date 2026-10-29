import React from 'react';
import styled from 'styled-components';

const IconCircle = styled.div`
    align-items: center;
    background-color: #fff3e0;
    border-radius: 50%;
    display: flex;
    flex: none;
    height: ${({ $size }) => $size}px;
    justify-content: center;
    width: ${({ $size }) => $size}px;

    &.centered {
        margin: 0 auto;
    }
`;

/** The warning mark used by every sunset surface, so they read as one family. */
export default function SunsetIcon({
    size = 40,
    centered = false,
    className = undefined,
}) {
    const glyph = Math.round(size * 0.55);

    return (
        <IconCircle
            $size={size}
            className={[centered ? 'centered' : '', className].filter(Boolean).join(' ')}
            aria-hidden='true'
        >
            <svg
                width={glyph}
                height={glyph}
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
            >
                <path
                    d='M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'
                    stroke='#f5a623'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                />
            </svg>
        </IconCircle>
    );
}
