import { utils } from 'near-api-js';
import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import Balance from '../common/balance/Balance';
import FormButton from '../common/FormButton';
import Modal from '../common/modal/Modal';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding-top: 40px;
    font-size: 13px;

    h2 {
        color: #24272a !important;
    }

    @media (min-width: 500px) {
        padding: 40px 25px;
    }

    .green {
        margin-top: 50px !important;
        width: 100% !important;
        max-width: 350px !important;
    }

    .link {
        margin-top: 30px !important;
    }

    .breakdown {
        width: 100%;
        margin-top: 40px;
        > div {
            display: flex;
            justify-content: space-between;
            padding: 15px 0;
            max-width: 400px;
            margin: 0 auto;

            :first-of-type {
                border-bottom: 1px solid #f5f5f3;
            }

            div {
                color: #292526;
                font-size: 14px;
                max-width: 200px;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }
    }
`;

const SendConfirmModal = ({ open, onClose, onConfirm, amount, receiver, loading }) => {
    return (
        <Modal
            id='stake-confirm-modal'
            isOpen={open}
            onClose={onClose}
            closeButton='desktop'
        >
            <Container>
                <h2>
                    <Translate id='sendMoney.confirmModal.title' />
                </h2>
                <div className='breakdown'>
                    <div>
                        Amount to send
                        <Balance amount={utils.format.parseNearAmount(amount)} />
                    </div>
                    <div>
                        Recipient
                        <div>{receiver}</div>
                    </div>
                </div>
                <FormButton
                    disabled={loading}
                    sending={loading}
                    color='green'
                    onClick={onConfirm}
                >
                    <Translate id='button.confirm' />
                </FormButton>
                <FormButton disabled={loading} color='link red' id='close-button'>
                    <Translate id='button.cancel' />
                </FormButton>
            </Container>
        </Modal>
    );
};

export default SendConfirmModal;
