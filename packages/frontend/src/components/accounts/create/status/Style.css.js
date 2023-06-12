import styled from 'styled-components';

const Style = styled.div`
    border-radius: 8px;
    color: #d5d4d8;
    font-size: 14px;
    background-color: #111618;

    > div {
        padding: 15px;

        &.status,
        &.amount {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
    }

    .address {
        > div {
            :first-of-type {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            :last-of-type {
                color: white;
                background-color: #3f4045;
                border-radius: 8px;
                word-break: break-all;
                padding: 15px;
                font-size: 14px;
                margin-top: 10px;
            }
        }
    }

    .status {
        border-top: 1px solid #d5d4d84f;
        border-bottom: 1px solid #d5d4d84f;
        span {
            border-radius: 40px;
            font-size: 11px;
            padding: 6px 14px;
            background-color: #ffdbb2;
            color: #995200;
        }
    }

    .amount {
        text-align: right;
        span {
            color: white;
            font-weight: 700;
            font-size: 14px;
        }
    }

    &.funded {
        .status {
            span {
                background-color: #90e9c5;
                color: #005a46;
            }
        }
    }

    .copy-funding-address {
        display: flex;
        align-items: center;
        font-size: 12px;
        color: #8fcdff;

        svg {
            margin-right: 4px;
            width: 16px;

            path {
                stroke: #8fcdff;
            }
        }
    }
`;

export default Style;
