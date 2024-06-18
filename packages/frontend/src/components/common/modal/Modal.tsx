import React, { useState, useEffect } from 'react';
import ReactDom from 'react-dom';

import CloseButton from './CloseButton';
import StyledModal from './Style';
import classNames from '../../../utils/classNames';
import isMobile from '../../../utils/isMobile';

const modalRoot = document.getElementById('modal-root');

interface IModal {
    isOpen?: boolean;
    onClose: () => void;
    id: string;
    modalSize?: string;
    modalClass?: string;
    children: React.ReactNode;
    closeButton?: string;
    disableClose?: boolean;
    mobileActionSheet?: boolean;
    'data-test-id'?: string;
    style?: React.CSSProperties;
}

function Modal({
    isOpen,
    onClose,
    id,
    modalSize,
    modalClass,
    children,
    closeButton,
    disableClose,
    mobileActionSheet = true,
    'data-test-id': testId,
    style,
}: IModal) {
    const background = React.createRef<HTMLDivElement>();
    const [fadeType, setFadeType] = useState(null);
    const [fullScreen, setFullScreen] = useState(null);
    const body = document.querySelector('body');

    useEffect(() => {
        if (isMobile()) {
            checkFullScreen();
        }

        const closeEl = document.getElementById('close-button');
        closeEl && closeEl.addEventListener('click', handleClick, false);
        window.addEventListener('keydown', onEscKeyDown, false);
        const fadeIn = setTimeout(() => setFadeType('in'), 0);
        body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', onEscKeyDown, false);
            closeEl && closeEl.removeEventListener('click', handleClick, false);
            clearTimeout(fadeIn);
            body.style.removeProperty('overflow');
        };
    }, []);

    useEffect(() => {
        setFadeType('out');
        if (isOpen) {
            setTimeout(() => {
                setFadeType('in');
            }, 500);
        }
    }, [isOpen]);

    const checkFullScreen = () => {
        const modalHeight = document
            .getElementById('modal-container')
            .getBoundingClientRect().height;
        const clientHeight = Math.max(
            document.documentElement.clientHeight || 0,
            window.innerHeight || 0
        );
        if (Math.round((modalHeight / clientHeight) * 100) > 90) {
            setFullScreen('full-screen');
        }
    };

    const transitionEnd = (e) => {
        if (e.propertyName !== 'opacity' || fadeType === 'in') {
            return;
        }

        if (fadeType === 'out') {
            onClose();
        }
    };

    const onEscKeyDown = (e) => {
        if (!disableClose) {
            if (e.key !== 'Escape') {
                return;
            }
            setFadeType('out');
        }
    };

    const handleClick = () => {
        if (!disableClose) {
            setFadeType('out');
        }
    };

    return ReactDom.createPortal(
        <StyledModal
            id={id}
            className={classNames([
                'modal-wrapper',
                `size-${modalSize}`,
                `fade-${fadeType}`,
                modalClass,
                fullScreen,
                { 'mobile-action-sheet': mobileActionSheet },
            ])}
            role='dialog'
            modalSize={modalSize}
            onTransitionEnd={transitionEnd}
            data-test-id={testId}
            style={style}
        >
            <div data-test-id='modalContainer' id='modal-container' className='modal'>
                {closeButton && (
                    <CloseButton device={closeButton} onClick={handleClick} />
                )}
                {children}
            </div>
            <div className='background' onMouseDown={handleClick} ref={background} />
        </StyledModal>,
        modalRoot
    );
}

export default Modal;
