import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

const NotificationWrapper = styled.p`
    margin: 0;
    padding: 0.6rem;
    font-size: 1.1rem;
    border-radius: 0.5rem;

    &.warning {
        background-color: #FFDBB2;
    }
`;

export default function Notification({ id, data, type }) {
    return (
        <NotificationWrapper className={`${type}`}>
            <Translate id={id} data={data} />
        </NotificationWrapper>
    );
}
