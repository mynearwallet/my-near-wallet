import styled from 'styled-components';

import Container from '../../components/common/styled/Container.css';

export const Wrapper = styled(Container)`
    h1 {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 900;
        font-size: 25px;
        line-height: 32px;
        text-align: center;
        width: 90%;
        margin: auto;
        margin-bottom: 48px;
    }

    form {
        margin-bottom: 16px;
    }

    button {
        width: 100%;
        margin-top: 0 !important;
    }
`;

export const Title = styled.h1``;

export const Password = styled.div`
    margin-bottom: 48px;
`;

export const Footer = styled.div`
    margin-top: 16px;
    text-align: center;
    display: flex;
    flex-direction: column;
    font-family: 'Inter';
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    color: #9BA1A6;
    margin-bottom: 65px;
`;
