import styled from 'styled-components';

export const Title = styled.div`
    font-weight: 900;
    font-size: 25px;
    line-height: 130%;
    
    text-align: center;
    margin-bottom: 40px;
    color: #000000;
`;

export const ConnectedWallets = styled.div`
    font-weight: 900;
    font-size: 20px;
    line-height: 130%;
    
    text-align: center;
    color: #24272A;
    margin-bottom: 32px;
`;

export const Description = styled.div`
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    text-align: center;
    color: #4C5155;
    
    margin-bottom: 32px;
`;

export const UserItem = styled.div`
    padding: 16px 32px;
    display: flex;
    align-items: center;
    border-top: 1px solid #EDEDED;
    justify-content: space-between;
    
    &:last-child {
        border-bottom: 1px solid #EDEDED;
    }
`;

export const UserContent = styled.div`
    display: flex;
    align-items: center;
`;

export const Username = styled.div`
    font-weight: 500;
    font-size: 14px;
    line-height: 17px;
    color: #24272A;
    margin-left: 9px;
`;

export const CheckboxWrapper = styled.div`
    padding: 16px 32px;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 70px;
`;

export const Label = styled.label`
    color: #0081f1;
    display: flex;
    cursor: pointer;
`;

export const CheckboxCaption = styled.div`
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    line-height: 20px;

    margin-left: 11px;
`;

export const Buttons = styled.div`
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
