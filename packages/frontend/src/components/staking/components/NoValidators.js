import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import FormButton from '../../common/FormButton';
import NearCircleIcon from '../../svg/NearCircleIcon.js';

const Container = styled.div`
    background-color: #f8f8f8;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    border-radius: 4px;
    margin: 20px 0px;
    padding: 20px;

    svg {
        margin-top: 20px;
    }

    div {
        margin-top: 25px;
        max-width: 230px;
        text-align: center;
        color: #b4b4b4;
    }

    button {
        &.blue {
            margin-bottom: 0 !important;
        }
    }
`;

export default function NoValidators({ accountId }) {
    return (
        <Container className='no-validators'>
            <NearCircleIcon />
            <div>
                <Translate id='staking.noValidators.title' />
            </div>
            <FormButton
                disabled={!accountId}
                className='gray-blue dark'
                linkTo='/staking/validators'
                trackingId='STAKE Click stake my tokens button : no validators'
            >
                <Translate id='staking.staking.button' />
            </FormButton>
        </Container>
    );
}
