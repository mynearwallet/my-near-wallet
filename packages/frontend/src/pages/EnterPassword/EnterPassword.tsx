import React, {FC, useState} from 'react';
import { Translate } from 'react-localize-redux';
// import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import FormButton from '../components/common/FormButton';
import { StyledContainer, StyledFooter } from './ui';
import PasswordInput from "../../components/common/PasswordInput";
// import { redirectTo } from '../redux/actions/account';



const EnterPassword: FC = () => {

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
                <PasswordInput />
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

export default EnterPassword;
