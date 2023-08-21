import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import FormButton from '../common/FormButton';
import PlusSignIcon from '../svg/PlusSignIcon';

const Button = styled(FormButton)`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin-top: 15px !important;

    svg {
        width: 22px !important;
        height: 22px !important;
        margin: -5px 6px -4px 0 !important;
    }
`;

const CreateAccountBtn = () => (
    <Button
        linkTo='/create'
        trackingId='CA Click create new account button'
        color='gray-blue'
    >
        <PlusSignIcon color='#0072CE' />
        <Translate id='button.createNewAccount' />
    </Button>
);

export default CreateAccountBtn;
