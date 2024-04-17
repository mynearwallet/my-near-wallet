import React, { useState } from 'react';
import styled from 'styled-components';
import { useImageLoading } from '../../../hooks/useImageLoading';
import FailedToLoad from '../../../images/failed_to_load.svg';
import LoadingSkeleton from '../loader/LoadingSkeleton';

const Container = styled.div`
    position: relative;
    border-radius: 8px;
`;

const LoadingContainer = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.5); /* Semi-transparent white background */
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
`;

const ImageWithLoading = ({
    src,
    alt,
    skip,
    loadImageTimeout,
}: {
    skip?: boolean;
    loadImageTimeout?: number;
} & HTMLImageElement) => {
    const [isErrorImage, setIsErrorImage] = useState(false);
    const { isLoaded, isError } = useImageLoading({
        imageUrl: src,
        skip,
        timeout: loadImageTimeout,
    });

    return (
        <Container>
            {!isLoaded && (!isError || !isErrorImage) && (
                <LoadingContainer>
                    <LoadingSkeleton />
                </LoadingContainer>
            )}
            {isError || isErrorImage ? (
                <img src={FailedToLoad} alt='error' />
            ) : (
                <img
                    src={src}
                    alt={alt}
                    onError={() => {
                        setIsErrorImage(true);
                    }}
                />
            )}
        </Container>
    );
};

export default ImageWithLoading;
