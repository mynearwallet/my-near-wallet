import styled from 'styled-components';

export const SwapDetailsWrapper = styled.div`
    width: 100%;
    border-radius: 0.5rem;
    background-color: #eceef0;

    .detailsRow:not(:last-child) {
        border-bottom: 1px solid var(--color-5);
    }
`;

export const AccordionTitle = styled.div`
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    padding: 1.2rem;
    border-radius: inherit;
    font-weight: 500;
    color: var(--color-4);
    background-color: var(--color-3);

    .chevron-icon {
        transform: rotate(90deg);
    }

    &.active {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;

        .chevron-icon {
            transform: rotate(-90deg);
        }
    }
`;
