import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import classNames from '../../utils/classNames';

const Container = styled.div`
    overflow: hidden;
    height: 0;
    transition: ${(props) => props.transition}ms;
    opacity: 0;

    &.open {
        opacity: 1;
        height: ${(props) => props.height}px;
    }
`;

const Accordion = ({ className, trigger, children, transition = '250' }) => {
    const [open, setOpen] = useState(false);
    const [contentHeight, setContentHeight] = useState('');

    useEffect(() => {
        const el = document.getElementById(trigger);
        el.addEventListener('click', handleClick);
        const contentHeight = document.getElementById(`${trigger}-wrapper`).getBoundingClientRect().height;
        const toggles = document.getElementsByClassName(`${trigger}-toggle`);
        setContentHeight(contentHeight);

        for (let toggle of toggles) {
            toggle.addEventListener('click', handleClick);
        }

        return () => {
            el.removeEventListener('click', handleClick);
            for (let toggle of toggles) {
                toggle.removeEventListener('click', handleClick);
            }
        };

    }, [open]);

    const handleClick = () => {
        setOpen(!open);
        const el = document.getElementById(trigger);
        const container = document.getElementById(`${trigger}-container`);
        if (!open) {
            el.classList.add('open');
            setTimeout(() => container.style.overflow = 'visible', 250);
        } else {
            container.style.overflow = 'hidden';
            el.classList.remove('open');
        }
    };

    return (
        <Container
            id={`${trigger}-container`}
            height={contentHeight}
            transition={transition}
            className={classNames([className, open ? 'open' : ''])}
        >
            <div id={`${trigger}-wrapper`}>
                {children}
            </div>
        </Container>
    );
};

export default Accordion;
