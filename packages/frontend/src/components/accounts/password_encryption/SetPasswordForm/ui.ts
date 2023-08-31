import styled from 'styled-components';

export const PasswordForm = styled.div`
    margin-bottom: 20px;
`;

export const WithoutPassword = styled.div<{ hide: boolean }>`
    opacity: ${(props) => (props.hide ? '0' : '1')};
    margin-top: 48px;
    font-weight: 500;
    font-size: 16px;
    line-height: 150%;
    text-align: center;
    color: #0072ce;
    flex: none;
    order: 3;
    align-self: stretch;
    flex-grow: 0;
    cursor: pointer;
`;

export const CheckBoxGroup = styled.div`
    margin-top: 30px;
`;

export const CheckBoxContainer = styled.div`
    display: flex;
    flex-direction: row;
    margin-bottom: 15px;
`;

export const CheckBoxWrapper = styled.div`
    flex: none;
    padding-right: 8px;
`;

export const CheckBoxLabel = styled.div`
    flex: 1 1 0%;
`;

export const Submit = styled.div`
    > button {
        margin: 0;
        width: 100%;
    }
`;
