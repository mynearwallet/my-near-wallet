import React, { FC } from 'react';
import { Translate } from 'react-localize-redux';

import Container from '../../common/styled/Container.css';
import SetPasswordForm from './SetPasswordForm';

function onSubmit(password: string) {
    console.log(password);
}

export const SetPasswordPage: FC<void> = () => {
    return (
        <Container className='small-centered border'>
            <form autoComplete='off'>
                <h1>
                    <Translate id='setupPasswordProtection.pageTitle' />
                </h1>
                <h2>
                    <Translate id='setupPasswordProtection.pageText' />
                </h2>
                <SetPasswordForm onSubmit={onSubmit} />
            </form>
        </Container>
    );
};
