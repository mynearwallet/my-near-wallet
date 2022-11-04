import styled, { css } from 'styled-components';

import languagesIcon from '../../../images/icon-languages.svg';

export const StyledWrapper = styled.div<{ isCompact: boolean }>`
    position: relative;
    display: flex;
    align-items: center;

    &:after {
        content: '';
        display: inline-block;
        position: absolute;
        right: 12px;
        top: calc(50% - 12px);
        transform: rotate(135deg) translateY(-50%);
        height: 9px;
        width: 9px;
        border-style: solid;
        border-width: 2px 2px 0 0;
        border-color: var(--mnw-color-11);
        pointer-events: none;
    }

    select {
        width: 100%;
        cursor: pointer;
        appearance: none;
        outline: none;
        height: 32px;
        border: 0;
        font-size: 1rem;
        color: var(--mnw-color-11);
        user-select: none;
        background: transparent url(${languagesIcon}) no-repeat 5px center / 20px 20px;
        text-indent: 40px;

        ${({ isCompact }) =>
            isCompact &&
            css`
                text-indent: 54px;
                width: 54px;
            `}
    }
`;
