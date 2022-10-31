import React, { useState } from 'react';
import { Translate } from 'react-localize-redux';
// import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import FormButton from '../components/common/FormButton';
import Container from '../components/common/styled/Container.css';
// import { redirectTo } from '../redux/actions/account';

const StyledContainer = styled(Container)`
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

const StyledErrorMsg = styled.div`
    min-height: 16px;
    margin-top: 8px;
    font-family: 'Inter';
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    color: #DC3D43;
`;

const StyledFooter = styled.div`
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

export default function CheckPasswordPage () {

    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsError(false);
        setIsLoading(true);
        
        // const value = e.target.password.value;
        try {
            // api call to check password
            // useDispatch(redirectTo('/'));
            // setIsError(false);

            setIsError(true);
            setIsLoading(false);
        } catch (err) {
            console.error(err);
            setIsError(true);
            setIsLoading(false);
        }
    };

    const handleRestore = (e) => {
        // some logic
    };
  
    return (
        <StyledContainer className='small-centered border'>
            <h1><Translate id='checkPassword.title' /></h1>
            <form onSubmit={handleSubmit}>
                <input name="password" type="password" />
                <StyledErrorMsg>
                    {isError && <Translate id="checkPassword.error" />}
                </StyledErrorMsg>
                <FormButton type="submit" disabled={isLoading}>
                    <Translate id="checkPassword.unlockBtn" />
                </FormButton>
            </form>
            <StyledFooter>
                <Translate id="checkPassword.forgotPas" />
                <Link onClick={handleRestore} to="/recover-seed-phrase">
                    <Translate id="checkPassword.restoreLink" />
                </Link>
            </StyledFooter>
        </StyledContainer>
    );
};
