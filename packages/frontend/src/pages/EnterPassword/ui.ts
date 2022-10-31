import styled from 'styled-components';

// todo
import Container from '../components/common/styled/Container.css';

export const StyledContainer = styled(Container)`
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
        width: 100% !important;
        margin-top: 30px !important;
    }
`;

export const StyledErrorMsg = styled.div`
    min-height: 16px;
    margin-top: 8px;
    font-family: 'Inter';
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    color: #DC3D43;
`;

export const StyledFooter = styled.div`
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
`;
