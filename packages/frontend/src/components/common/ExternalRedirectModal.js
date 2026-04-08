import React from 'react';
import { Translate } from 'react-localize-redux';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import {
    actions as externalRedirectActions,
    selectPendingExternalRedirectUrl,
} from '../../redux/slices/externalRedirect';
import FormButton from './FormButton';
import Modal from './modal/Modal';

const Container = styled.div`
    padding: 10px 0 20px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    h2 {
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 16px;
    }

    p {
        color: #72727a;
        font-size: 14px;
        line-height: 1.6;
        margin: 0 0 8px 0;
    }

    .destination {
        background: #f5f5f3;
        border-radius: 8px;
        padding: 10px 16px;
        margin: 12px 0 16px 0;
        font-size: 14px;
        font-weight: 600;
        word-break: break-all;
        width: 100%;
    }

    .warning {
        color: #e5484d;
        font-size: 13px;
        margin-bottom: 8px;
    }

    .buttons {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 8px;

        button {
            margin: 0;
            width: 100%;
        }
    }
`;

const ExternalRedirectModal = () => {
    const dispatch = useDispatch();
    const pendingUrl = useSelector(selectPendingExternalRedirectUrl);

    if (!pendingUrl) {
        return null;
    }

    let displayHost = pendingUrl;
    try {
        displayHost = new URL(pendingUrl).host;
    } catch (_) {
        // fall back to full URL
    }

    const handleCancel = () => {
        dispatch(externalRedirectActions.clearExternalRedirect());
    };

    const handleContinue = () => {
        dispatch(externalRedirectActions.clearExternalRedirect());
        window.location.href = pendingUrl;
    };

    return (
        <Modal
            id='external-redirect-modal'
            isOpen={!!pendingUrl}
            onClose={handleCancel}
            closeButton='true'
            modalSize='sm'
        >
            <Container>
                <h2>
                    <Translate id='externalRedirectModal.title' />
                </h2>
                <p>
                    <Translate id='externalRedirectModal.desc' />
                </p>
                <div className='destination'>{displayHost}</div>
                <p className='warning'>
                    <Translate id='externalRedirectModal.warning' />
                </p>
                <div className='buttons'>
                    <FormButton
                        color='gray-gray'
                        onClick={handleCancel}
                    >
                        <Translate id='externalRedirectModal.cancel' />
                    </FormButton>
                    <FormButton
                        color='red'
                        onClick={handleContinue}
                    >
                        <Translate id='externalRedirectModal.continue' />
                    </FormButton>
                </div>
            </Container>
        </Modal>
    );
};

export default ExternalRedirectModal;
