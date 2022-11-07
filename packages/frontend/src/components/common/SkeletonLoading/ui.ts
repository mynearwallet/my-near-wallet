import styled from 'styled-components';

export const Wrapper = styled.div`
    position: relative;
    min-width: 100%;
    min-height: 10px;
`;

export const Animation = styled.div`
    animation-duration: 1s;
    animation-fill-mode: forwards;
    animation-iteration-count: infinite;
    animation-name: skeletonShimmer;
    animation-timing-function: cubic-bezier(.17,.67,.83,.67);
    background: #f4f4f4;
    background: linear-gradient(to right, #f4f4f4 0%, #efeded 50%, #f4f4f4 100%);
    background-size: 200% 100%;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    position: absolute;

    @keyframes skeletonShimmer{
        0%{
            background-position: 100% 0
        }
        100%{
            background-position: -100% 0
        }
    }
`;
