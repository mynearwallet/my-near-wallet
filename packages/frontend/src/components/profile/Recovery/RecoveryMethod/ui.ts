import styled, { css } from 'styled-components';

export const Container = styled.div`
    border: 2px solid #f0f0f1;
    border-radius: 8px;

    width: 100%;
    padding: 16px;
`;

export const Main = styled.div<{ isColumn?: boolean }>`
    display: flex;
    justify-content: space-between;
    align-items: center;

    button {
        margin: 0 !important;
    }

    ${({ isColumn }) =>
        isColumn &&
        css`
            flex-direction: column;
            align-items: flex-start;
        `}
`;

export const TitleWrapper = styled.div`
    width: 100%;
    display: flex;
`;

export const StyledButtons = styled.div<{ areManyButtons?: boolean }>`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: end;

    ${({ areManyButtons }) =>
        areManyButtons &&
        css`
            margin-top: 1rem;

            button {
                width: 100% !important;

                &:not(:last-child) {
                    margin-right: 9px !important;
                }
            }
        `}
`;

export const Title = styled.div`
    font-weight: 700;
    font-size: 14px;
    line-height: 150%;
    color: #3f4045;
`;

export const Description = styled.div`
    margin-top: 26px;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    color: #a2a2a8;
`;
