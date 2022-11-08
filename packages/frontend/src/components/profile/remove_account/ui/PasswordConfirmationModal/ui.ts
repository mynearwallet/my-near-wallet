import styled from 'styled-components';

export const StyledButtons = styled.div`
    margin-top: 3rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;

    button {
        height: 3rem;
        flex: 1;
        border: none;
        border-radius: 3.125rem;
        font-weight: 700;
        font-size: 1rem;
        color: var(--mnw-color-1);
        background-color: var(--mnw-color-inactive-1);

        &:not(:last-child) {
            margin-right: 1rem;
        }

        &.primary {
            color: var(--mnw-color-text-1);
            background-color: var(--mnw-color-1);
        }

        &:disabled {
            cursor: not-allowed;
            color: var(--mnw-color-inactive-2);
            background-color: var(--mnw-color-inactive-1);
        }
    }
`;

export const StyledTitle = styled.h3`
    margin-bottom: 3rem;
    font-size: 1.5rem;
    font-weight: 900;
    text-align: center;
`;
