import styled from 'styled-components';

export const PasswordForm = styled.div`
  margin-bottom: 72px;
`;

export const WithoutPassword = styled.div<{ hide: boolean }>`
    opacity: ${(props) => props.hide ? '0' : '1'};
    margin-top: 48px;
    font-weight: 500;
    font-size: 16px;
    line-height: 150%;
    text-align: center;
    color: #0072CE;
    flex: none;
    order: 3;
    align-self: stretch;
    flex-grow: 0;
    cursor: pointer;
`;

export const Submit = styled.div`
    > button {
        margin: 0;
        width: 100%;
    }
`;

export const SkipForm = styled.div`
    padding: 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

export const SkipTitle = styled.div`
    font-weight: 900;
    font-size: 25px;
    line-height: 130%;
    margin-bottom: 40px;
    color: #000000;
`;

export const SkipDescription = styled.div`
    font-weight: 400;
    font-size: 16px;
    line-height: 20px;
    margin-bottom: 40px;
    color: #000000;
`;

export const SkipControls = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
    
    > button {
        width: 100%;

        &:first-child {
          margin-right: 16px !important;
        }
    }
    
`;
