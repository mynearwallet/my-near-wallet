import React from 'react';
import styled from 'styled-components';

const Spinner = styled.div`
    width: 40px;
    height: 40px;
    border: 5px solid #ccc;
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

const LoadingSpinner = () => {
    return <Spinner />;
};

export default LoadingSpinner;
