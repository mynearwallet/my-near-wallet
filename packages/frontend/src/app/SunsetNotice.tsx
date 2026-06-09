import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import FormButton from '../components/common/FormButton';
import FormButtonGroup from '../components/common/FormButtonGroup';
import Modal from '../components/common/modal/Modal';

// Storage key tracking when the sunset notice was last shown to the user.
const STORAGE_KEY = 'sunsetNoticeLastShownAt';
// Show the notice at most once every 4 days.
const SHOW_INTERVAL_MS = 4 * 24 * 60 * 60 * 1000;
// Where the "Learn more" button takes the user.
const LEARN_MORE_URL = 'https://www.mynearwallet.com';

const Container = styled.div`
    text-align: left;

    .icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background-color: #fff3e0;
        margin-bottom: 16px;
    }

    .title {
        font-weight: 600;
        font-size: 20px;
        color: #24272a;
        margin: 0 0 20px;
    }

    .body {
        color: #72727a;
        font-size: 15px;
        line-height: 1.5;

        p {
            margin: 0 0 14px;
        }

        strong {
            color: #24272a;
            font-weight: 600;
        }
    }

    .divider {
        border: none;
        border-top: 1px solid #f0f0f1;
        margin: 16px 0 20px;
    }
`;

function shouldShowNotice() {
    try {
        const lastShown = localStorage.getItem(STORAGE_KEY);
        if (!lastShown) {
            return true;
        }
        const lastShownAt = Number(lastShown);
        if (Number.isNaN(lastShownAt)) {
            return true;
        }
        return Date.now() - lastShownAt > SHOW_INTERVAL_MS;
    } catch {
        return false;
    }
}

export default function SunsetNotice() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (shouldShowNotice()) {
            try {
                localStorage.setItem(STORAGE_KEY, String(Date.now()));
            } catch {
                // Ignore storage failures (e.g. private mode) and still show once.
            }
            setIsOpen(true);
        }
    }, []);

    const onClose = () => setIsOpen(false);

    if (!isOpen) {
        return null;
    }

    return (
        // @ts-ignore — Modal is a JS component without full prop typings
        <Modal id='modal-sunset-notice' isOpen={isOpen} onClose={onClose} modalSize='sm'>
            <Container>
                <div className='icon'>
                    <svg
                        width='22'
                        height='22'
                        viewBox='0 0 24 24'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                    >
                        <path
                            d='M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'
                            stroke='#f5a623'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                    </svg>
                </div>
                <h3 className='title'>MyNearWallet is being sunset</h3>
                <hr className='divider' />
                <div className='body'>
                    <p>
                        MyNearWallet will be gradually sunset as part of the NEAR
                        ecosystem transition and is planned to be deprecated on{' '}
                        <strong>31 October 2026</strong>.
                    </p>
                    <p>Your funds remain safe and no immediate action is required.</p>
                    <p>
                        Over the coming months we will provide guided migration options to
                        supported NEAR wallets.
                    </p>
                </div>
                <FormButtonGroup>
                    <FormButton
                        color='gray-blue'
                        className='border'
                        onClick={() => window.open(LEARN_MORE_URL, '_blank')}
                    >
                        Learn more
                    </FormButton>
                    <FormButton onClick={onClose}>Continue</FormButton>
                </FormButtonGroup>
            </Container>
        </Modal>
    );
}
