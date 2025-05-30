import BN from 'bn.js';
import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import SignTransaction from './SignTransaction';
import AlertBanner from '../../common/AlertBanner';
import FormButton from '../../common/FormButton';
import FormButtonGroup from '../../common/FormButtonGroup';
import Container from '../../common/styled/Container.css';
import ConnectWithApplication from '../../login/v2/ConnectWithApplication';
import ConnectWithPrivateShard from '../../login/v2/ConnectWithPrivateShard';
import { useSelector } from 'react-redux';
import { selectSignTransactions } from '../../../redux/slices/sign';

const StyledContainer = styled(Container)`
    &&& {
        h3 {
            color: #272729;
            text-align: center;
        }

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

        .connect-with-application {
            margin: 20px auto 30px auto;
        }

        .alert-banner {
            margin: 20px 0;
            border-radius: 4px;
        }
    }
`;

export default ({
    transferAmount,
    accountLocalStorageAccountId,
    availableBalance,
    estimatedFees,
    onClickCancel,
    onClickApprove,
    onClickMoreInformation,
    accountUrlReferrer,
    submittingTransaction,
    isSignerValid,
    isValidCallbackUrl,
    privateShardInfo,
}) => {
    const insufficientBalance =
        availableBalance &&
        transferAmount &&
        new BN(availableBalance).lt(new BN(transferAmount));
    const transactions = useSelector(selectSignTransactions);

    const hasFullAccessKeyAction = transactions.some((transaction) =>
        transaction.actions.some(
            (action) =>
                action.enum === 'addKey' &&
                action?.addKey?.accessKey?.permission?.enum === 'fullAccess'
        )
    );

    return (
        <StyledContainer className='small-centered border'>
            <h3>
                <Translate id='sign.approveTransaction' />
            </h3>
            {privateShardInfo ? (
                <ConnectWithPrivateShard privateShardInfo={privateShardInfo} />
            ) : (
                <ConnectWithApplication appReferrer={accountUrlReferrer} />
            )}
            {insufficientBalance && (
                <AlertBanner title='sign.insufficientFundsDesc' theme='warning' />
            )}
            {hasFullAccessKeyAction && (
                <AlertBanner title='sign.addFullAccessKey' theme='warning' />
            )}
            <SignTransaction
                sender={accountLocalStorageAccountId}
                estimatedFees={estimatedFees}
                availableBalance={availableBalance}
                privateShardInfo={privateShardInfo}
                transactions={transactions}
            />
            <FormButton className='link' onClick={onClickMoreInformation}>
                <Translate id='button.moreInformation' />
            </FormButton>
            <FormButtonGroup>
                <FormButton
                    color='gray-blue'
                    onClick={onClickCancel}
                    disabled={submittingTransaction || !isValidCallbackUrl}
                >
                    <Translate id='button.cancel' />
                </FormButton>
                <FormButton
                    onClick={onClickApprove}
                    disabled={
                        submittingTransaction ||
                        insufficientBalance ||
                        !isValidCallbackUrl ||
                        !isSignerValid
                    }
                    sending={submittingTransaction}
                >
                    <Translate id='button.approve' />
                </FormButton>
            </FormButtonGroup>
        </StyledContainer>
    );
};
