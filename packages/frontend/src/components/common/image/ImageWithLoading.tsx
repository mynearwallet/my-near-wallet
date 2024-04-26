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
    style,
    skip,
    loadImageTimeout,
}: {
    skip?: boolean;
    loadImageTimeout?: number;
    style?: HTMLStyleElement;
} & Partial<HTMLImageElement>) => {
    const [isErrorImage, setIsErrorImage] = useState(false);
    const { isLoaded, isError } = useImageLoading({
        imageUrl: src,
        skip,
        timeout: loadImageTimeout,
    });

    return (
        <Container className='image-withloading-container'>
            {!isLoaded && (!isError || !isErrorImage) && (
                <LoadingContainer>
                    <LoadingSkeleton />
                </LoadingContainer>
            )}
            {isError || isErrorImage ? (
                <img
                    className='image-withloading__image'
                    src={FailedToLoad}
                    alt='error'
                    style={style}
                />
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
