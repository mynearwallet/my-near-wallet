import React from 'react';
import styled from 'styled-components';

const Shimmer = styled.div`
    background: #f0f0f0;
    background-image: linear-gradient(to right, #f6f6f6 0%, #e9e9e9 50%, #f6f6f6 100%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite ease-in-out;
    border-radius: 4px; /* Adjust as needed */

    @keyframes shimmer {
        from {
            background-position: 0 0;
        }
        to {
            background-position: 200% 0;
        }
    }
`;

interface SkeletonProps {
    width?: string;
    height?: string;
}

const LoadingSkeleton = ({ width = '100%', height = '100%' }: SkeletonProps) => {
    return <Shimmer className='loading-skeleton' style={{ width, height }} />;
};

export default LoadingSkeleton;
