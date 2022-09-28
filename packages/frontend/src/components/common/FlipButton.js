import React, { useRef } from 'react';
import styled from 'styled-components';

import useHover from '../../hooks/useHover';
import WrapIcon from '../svg/WrapIcon';

const FlipButtonWrapper = styled.button`
    height: 2.5rem;
    width: 4.5rem;
    margin: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 3.125rem;
    border-color: transparent;
    background-color: #e1f0ff;
    transition: 100ms;

    :hover {
        background-color: var(--color-1);
    }
`;

export default function FlipButton({ onClick }) {
    const hoverRef = useRef(null);
    const isHover = useHover(hoverRef);

    return (
        <FlipButtonWrapper ref={hoverRef} onClick={onClick}>
            <WrapIcon color={isHover ? '#ffffff' : 'var(--color-1)'} />
        </FlipButtonWrapper>
    );
}
