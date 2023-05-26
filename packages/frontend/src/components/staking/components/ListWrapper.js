import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
    > div {
        border: 0;
        border-bottom: 2px solid #f2f2f2;
        border-radius: 0;
        padding: 15px 0;
        background-color: transparent;

        .user-icon {
            .background {
                fill: #f8f8f8;
            }
        }

        &:last-of-type {
            border-bottom: 0;
        }

        @media (max-width: 767px) {
            margin: 0 -14px;
            padding: 15px 14px;
        }
    }

    .chevron-icon {
        display: block;
    }
`;

export default function ListWrapper(props) {
    return <Container>{props.children}</Container>;
}
