import styled from 'styled-components';

export const Wrapper = styled.div`
    width: 100%;
`;

export const Title = styled.h1`
    height: 64px;
    font-weight: 900;
    font-size: 25px;
    line-height: 130%;
    text-align: center;
    
    margin-bottom: 48px;
`;

export const Password = styled.div`
    margin-bottom: 48px;
`;

export const Submit = styled.div`
    button {
        width: 100%;
        margin-top: 0 !important;
    }
`;

export const Footer = styled.div`
    cursor: pointer;
    margin-top: 16px;
    text-align: center;
    display: flex;
    flex-direction: column;
    font-family: 'Inter';
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    color: #9ba1a6;
    margin-bottom: 65px;
`;

export const RestoreLink = styled.div`
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    letter-spacing: 0em;
    text-align: center;
    color: #2f72c7;
`;
