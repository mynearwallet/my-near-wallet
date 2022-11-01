import React, {useCallback} from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import FormButton from '../../../common/FormButton';
import Container from '../../../common/styled/Container.css';
import SafeTranslate from '../../../SafeTranslate';

const StyledContainer = styled(Container)`
    h4 {
        margin-top: 20px;
    }

    input {
        margin-bottom: 30px;
    }

    .color-red {
        margin-top: -20px;
    }
    
    &&& {
        button {
            width: 100%;
            margin-top: 20px;
            &.link {
                &.start-over {
                    margin: 30px auto 0 auto;
                    display: inherit;
                }
            }
        }
    }
`;

export default ({
    userInputValue,
    wordIndex,
    onStartOver,
    userInputValueWrongWord,
    finishingSetup,
    onConfirmPassphrase,
    onWordChange,
}) => {
    const handleValueChange = useCallback((e) => {
        onWordChange(e.target.value);
    }, [onWordChange]);

    return (
        <StyledContainer className='small-centered border'>
            <form
                onSubmit={(e) => {
                    onConfirmPassphrase();
                    e.preventDefault();
                }}
                disabled={finishingSetup}
                autoComplete='off'
            >
                <h1><Translate id='setupSeedPhraseVerify.pageTitle' /></h1>
                <h2><Translate id='setupSeedPhraseVerify.pageText' /></h2>
                <h4 data-test-id='seedPhraseVerificationWordNumber'>
                    <SafeTranslate
                        id='input.enterWord.title'
                        data={{ wordId: wordIndex + 1 }}
                    />
                </h4>
                <input
                    data-test-id='seedPhraseVerificationWordInput'
                    value={userInputValue}
                    onChange={handleValueChange}
                    required
                    tabIndex='1'
                    pattern='[a-zA-Z ]*'
                    className={userInputValueWrongWord ? 'problem' : ''}
                />
                {userInputValueWrongWord && (
                    <div className='color-red'>
                        <Translate id='setupSeedPhraseVerify.inputError' />
                    </div>
                )}
                <FormButton
                    type='submit'
                    data-test-id='seedPhraseVerificationWordSubmit'
                    sending={finishingSetup}
                    disabled={!userInputValue || finishingSetup}
                >
                    <Translate id='button.verify' />
                </FormButton>
                <FormButton
                    type='button'
                    color='gray'
                    className='link start-over'
                    onClick={onStartOver}
                    disabled={finishingSetup}
                >
                    <Translate id='button.startOver' />
                </FormButton>
            </form>
        </StyledContainer>
    );
};
