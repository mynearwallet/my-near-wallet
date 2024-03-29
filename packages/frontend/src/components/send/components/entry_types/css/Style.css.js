import styled from 'styled-components';

const Style = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 15px;
    color: #72727a;

    &.information {
        color: #272729;
        font-weight: 600;

        > div {
            font-weight: 400;
            word-break: break-all;
            text-align: right;
            margin-left: 20px;
        }
    }

    .tooltip {
        margin-right: auto;
        width: 15px;
        margin-top: 2px;
    }

    .icon,
    .amount {
        display: flex;
        align-items: center;
        color: #272729;
        font-weight: 600;
        font-size: 16px;
        text-align: right;
    }

    .icon {
        span {
            margin-right: 10px;
            border-radius: 50%;
            box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.15);
            overflow: hidden;
            height: 32px;
            width: 32px;
        }

        img,
        svg {
            height: 32px;
            width: 32px;
        }
    }

    .receiver {
        font-weight: 600;
        background-color: #f0f0f1;
        padding: 10px 18px;
        border-radius: 40px;
    }

    .time,
    .status {
        color: #3f4045;
    }

    &.stand-alone {
        border-radius: 8px;
        background-color: #fafafa;
    }
`;

export default Style;
