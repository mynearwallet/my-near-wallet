import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import FormButton from '../../common/FormButton';
import Container from '../../common/styled/Container.css';
import SafeTranslate from '../../SafeTranslate';

const StyledContainer = styled(Container)`
    &&& {
        h1 {
            margin-top: 50px;
            text-align: center;
        }

        button {
            margin: 40px auto 0 auto;
            display: block;
            width: 100%;
        }
    }
`;

const AutoImport = ({
    accountId,
    recoveryState,
    onClickRecoverWithSecretKey,
    onCancel,
}) => {
    const content = () => {
        if (recoveryState === 'failed') {
            return (
                <>
                    <h1>
                        <SafeTranslate
                            id={`importAccount.${
                                accountId ? 'withIdFailed' : 'noIdFailed'
                            }`}
                            data={{ accountId: accountId }}
                        />
                    </h1>
                    <FormButton onClick={() => onClickRecoverWithSecretKey()}>
                        <Translate id='button.tryAgain' />
                    </FormButton>
                    {onCancel ? (
                        <FormButton color='gray-blue' onClick={onCancel}>
                            <Translate id='button.cancel' />
                        </FormButton>
                    ) : (
                        <FormButton color='gray-blue' linkTo='/create'>
                            <Translate id='button.createNewAccount' />
                        </FormButton>
                    )}
                </>
            );
        } else if (recoveryState === 'pending') {
            return (
                <h1 className='animated-dots'>
                    <SafeTranslate
                        id={`importAccount.${accountId ? 'withId' : 'noId'}`}
                        data={{ accountId: accountId }}
                    />
                </h1>
            );
        } else {
            return (
                <>
                    <h1>Preparing import</h1>
                    <FormButton onClick={onClickRecoverWithSecretKey}>
                        Start import
                    </FormButton>
                </>
            );
        }
    };
    return <StyledContainer className='small-centered'>{content()}</StyledContainer>;
};

export default AutoImport;
