import React from 'react';
import styled from 'styled-components';

const Spinner = styled.div<{ $size: number }>`
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    border: ${({ $size }) => Math.max(2, Math.round($size / 8))}px solid #ccc;
    border-radius: 50%;
    border-top-color: #3498db; /* Blue color for the spinning part */
    animation: spin 1s linear infinite;

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
`;

const LoadingSpinner = ({ size = 40 }: { size?: number }) => {
    return <Spinner $size={size} />;
};

export default LoadingSpinner;
