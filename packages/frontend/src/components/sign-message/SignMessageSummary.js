import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import SignMessage from './SignMessage';
import FormButton from '../common/FormButton';
import FormButtonGroup from '../common/FormButtonGroup';
import Container from '../common/styled/Container.css';

const StyledContainer = styled(Container)`
    background-color: ##f0f0f1;
    padding: 25px;
    &&& {
        > button {
            &.link {
                font-weight: normal;
                margin: 25px auto 0 auto;
                display: block;
                :before {
                    content: '+';
                    letter-spacing: 5px;
                }
            }
        }
        .button-group {
            margin-top: 25px;
        }
    }
`;

export default ({
    accountId,
    onClickCancel,
    onClickApprove,
    accountUrlReferrer,
    signing,
    message,
    isValidCallbackUrl,
    isValidNonce,
    disableApprove,
}) => {
    return (
        <StyledContainer className='small-centered border brs-8 bsw-l'>
            <SignMessage
                accountId={accountId}
                appName={accountUrlReferrer}
                message={message}
            />
            <FormButtonGroup>
                <FormButton
                    color='gray-blue'
                    onClick={onClickCancel}
                    disabled={signing || !isValidCallbackUrl || !isValidNonce}
                >
                    <Translate id='button.cancel' />
                </FormButton>
                <FormButton
                    data-test-id='approve-verify-owner'
                    onClick={onClickApprove}
                    disabled={
                        signing || !isValidCallbackUrl || !isValidNonce || disableApprove
                    }
                    sending={signing}
                >
                    <Translate id='button.sign' />
                </FormButton>
            </FormButtonGroup>
        </StyledContainer>
    );
};
