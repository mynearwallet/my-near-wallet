import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import ArrowUpImage from '../../images/icon-arrow-up-green.svg';
import RetryImage from '../../images/icon-retry-tx.svg';
import FormButton from '../common/FormButton';
import Container from '../common/styled/Container.css';

const CustomContainer = styled(Container)`
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #25282a;
    text-align: center;

    .title {
        margin-top: 24px;

        h2 {
            font-weight: 900;
            font-size: 22px;
            color: #24272a;
        }
    }

    && .text {
        color: #72727a;
        margin-top: 24px;
    }

    .buttons {
        display: flex;
        width: 100%;
        margin-top: 40px;

        button {
            flex: 1;

            &:last-of-type {
                margin-left: 30px;

                @media (min-width: 768px) {
                    margin-left: 50px;
                }
            }
        }
    }

    .fees {
        width: 100%;
        border: 1px solid #f0f0f1;
        padding: 15px;
        border-radius: 8px;
        margin-top: 30px;
        color: #72727a;

        b {
            color: #25282a;
        }

        .fees-line {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 12px;

            .tgas {
                color: #00c08b;
                position: relative;

                :after {
                    content: '';
                    position: absolute;
                    background: url(${ArrowUpImage}) center top no-repeat;
                    width: 16px;
                    height: 17px;
                    left: -22px;
                    top: 1px;
                }
            }
        }
    }
`;

const SignTransferRetry = ({
    handleRetry,
    handleCancel,
    gasLimit,
    submittingTransaction,
}) => (
    <CustomContainer className='small-centered border'>
        <div className='icon'>
            <img src={RetryImage} alt='Retry' />
        </div>
        <div className='title'>
            <h2>
                <Translate id='sign.retry.title' />
            </h2>
        </div>
        <div className='text'>
            <Translate id='sign.retry.text' />
            <br />
            <br />
            <a
                href='https://docs.near.org/docs/concepts/gas'
                target='_blank'
                rel='noreferrer'
            >
                <Translate id='sign.retry.link' />
            </a>
        </div>
        <div className='fees'>
            <div className='fees-line'>
                <b>
                    <Translate id='sign.networkFees' />
                </b>
            </div>
            <div className='fees-line'>
                <Translate id='sign.estimatedFees' />
                <div>NEAR</div>
            </div>
            <div className='fees-line'>
                <Translate id='sign.feeLimit' />
                <div className='tgas'>{gasLimit} Tgas</div>
            </div>
        </div>
        <div className='buttons'>
            <FormButton
                onClick={handleCancel}
                disabled={submittingTransaction}
                color='gray-blue'
            >
                <Translate id='button.cancel' />
            </FormButton>
            <FormButton
                onClick={handleRetry}
                disabled={submittingTransaction}
                sending={submittingTransaction}
            >
                <Translate id='button.resubmit' />
            </FormButton>
        </div>
    </CustomContainer>
);

export default SignTransferRetry;
