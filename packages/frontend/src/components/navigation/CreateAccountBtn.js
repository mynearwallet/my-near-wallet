import React from 'react';
import { Translate } from 'react-localize-redux';
import { useHistory } from 'react-router';
import styled from 'styled-components';

import { hasEncryptedAccount } from '../../redux/slices/login';
import FormButton from '../common/FormButton';
import PlusSignIcon from '../svg/PlusSignIcon';

const Button = styled(FormButton)`
    padding: 0;
    margin-top: 15px !important;

    svg {
        width: 24px !important;
        height: 24px !important;
        margin: -4px 3px -6px 0 !important;
    }
`;

const CreateAccountBtn = () => {
    const history = useHistory();

    return (
        <Button
            onClick={() => {
                if (hasEncryptedAccount()) {
                    history.push('/login', {
                        next: '/create',
                        desc: 'Please enter your password again to create new account',
                        title: 'Create account',
                    });
                } else {
                    history.push('/create');
                }
            }}
            trackingId='CA Click create new account button'
            color='gray-blue'
        >
            <PlusSignIcon color='#0072CE' />
            <Translate id='button.createNewAccount' />
        </Button>
    );
};

export default CreateAccountBtn;
