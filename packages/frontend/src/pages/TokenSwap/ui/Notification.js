import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import AlertTriangleIcon from '../../../components/svg/AlertTriangleIcon';

const NotificationWrapper = styled.p`
    margin: 0;
    padding: 0.75rem;
    display: flex;
    font-size: 1.1rem;
    border-radius: 0.25rem;

    &.warning {
        color: var(--color-warning);
        background-color: var(--color-warning-background);
    }

    span {
        margin-left: 0.6rem;
    }
`;

const IconWrapper = styled.span`
    padding: 0.1rem;
`;

export default function Notification({ id, data, type }) {
    return (
        <NotificationWrapper className={`${type}`}>
            <IconWrapper>
                <AlertTriangleIcon />
            </IconWrapper>
            <span>
                <Translate id={id} data={data} />
            </span>
        </NotificationWrapper>
    );
}
