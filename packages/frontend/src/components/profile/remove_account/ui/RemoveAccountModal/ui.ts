import styled from 'styled-components';

export const StyledRemoveAccountModal = styled.div`
    &&&&& {
        padding: 15px 0 10px 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;

        label {
            cursor: pointer;
            text-align: left;
            display: flex;
            background-color: #f5faff;
            margin: 25px -25px 0 -25px;
            padding: 15px 25px;
            line-height: 1.5;

            > div {
                > div {
                    border-color: var(--mwn-color-50);
                }
            }

            > span {
                margin-left: 10px;
                word-break: break-word;
                color: var(--mnw-color-2);
            }

            b {
                color: #272729;
            }
        }

        > button {
            margin-top: 25px;
            width: 100%;
        }
    }
`;

export const StyledTitle = styled.h3`
    margin: 15px 0;
    font-size: 18px;
    font-weight: 700;
`;

export const StyledDescription = styled.p`
    line-height: 1.5;
`;
