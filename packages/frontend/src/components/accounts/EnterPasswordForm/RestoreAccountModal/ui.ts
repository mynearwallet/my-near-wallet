import styled from 'styled-components';

export const Title = styled.div`
    font-weight: 900;
    font-size: 25px;
    line-height: 130%;
    
    text-align: center;
    margin-bottom: 40px;
    color: #000000;
`;

export const Description = styled.div`
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    color: #4c5155;
    
    margin-bottom: 32px;
`;

export const Label = styled.label`
    color: #0081f1;
    display: flex;
    cursor: pointer;
    
    margin-bottom: 38px;
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
    flex-direction: column;
    align-items: center;

    width: 100%;
    
    > button {
        width: 100%;
    }
`;
