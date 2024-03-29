import React from 'react';
import styled from 'styled-components';

import SafeTranslate from '../../../components/SafeTranslate';
import classNames from '../../../utils/classNames';
import ChevronIcon from '../../svg/ChevronIcon';

const StyledContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f0f0f1;
    padding: 10px;
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
    cursor: pointer;
    font-size: 13px;

    > svg {
        width: 10px;
        height: 10px;
        transform: rotate(90deg);
        margin-left: 8px;
    }

    &.open {
        background-color: #fafafa;

        > svg {
            transform: rotate(-90deg);
        }
    }
`;

const AccordionTrigger = ({ id, onClick, translateIdTitle, translateData, open }) => {
    return (
        <StyledContainer
            id={id}
            onClick={onClick}
            className={classNames(['accordion-trigger', open ? 'open' : ''])}
        >
            <SafeTranslate id={translateIdTitle} data={translateData} />
            <ChevronIcon color='var(--mnw-color-1)' />
        </StyledContainer>
    );
};

export default AccordionTrigger;
