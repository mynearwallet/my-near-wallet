import styled from 'styled-components';

export const CreatePasswordTitle = styled.div`
    font-weight: 900;
    font-size: 25px;
    line-height: 130%;
    
    text-align: center;
    
    color: #202425;
    margin-bottom: 24px;
`;

export const CreatePasswordDescription = styled.div`
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 150%;
    
    text-align: center;
    color: #697177;
    margin-bottom: 48px;
`;

export const PasswordForm = styled.div`
  margin-bottom: 48px;
`;

export const Controls = styled.div`
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
