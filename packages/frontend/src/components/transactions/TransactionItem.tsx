import React from 'react';
import styled from 'styled-components';

import Card from '../common/styled/Card.css';

export enum ETxStatus {
    success = 'success',
    fail = 'fail',
}

export enum ETxDirection {
    receive = 'receive',
    send = 'send',
    self = 'self',
    unknown = 'unknown',
}

export interface TransactionItemProps {
    id: string;
    image: string;
    image2?: string;
    // Sent, Received, Swapped
    title: string;
    subtitle?: React.ReactNode;
    dateTime?: string;
    assetChangeText?: string;
    assetChangeText2?: string;
    status?: ETxStatus;
    dir?: ETxDirection;
    // transaction hash
    leftCaption?: string;
    hasError?: boolean;
    isNft?: boolean;
}

export const TransactionItem = (props: TransactionItemProps) => {
    return (
        <StyledContainer>
            <div className='desc-container'>
                <img className='image' src={props.image} alt='transaction-icon' />
                <div className='desc-container-content'>
                    <div className='content-title'>
                        <div className='title'>{props.title}</div>
                        <div className='asset-change1'>{props.assetChangeText}</div>
                    </div>
                    <div className='content-subtitle'>
                        <div className='subtitle'>{props.subtitle}</div>
                        <div className='asset-change2'>{props.assetChangeText2}</div>
                    </div>
                </div>
            </div>
            <div className='caption-container'>
                <div className='hash'>{props.leftCaption}</div>
                <div className='datetime'>{props.dateTime}</div>
            </div>
        </StyledContainer>
    );
};

const StyledContainer = styled(Card)`
    display: flex;
    flex-direction: column;
    margin: 10px 0;
    padding: 15px 20px;
    .desc-container {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .image {
        width: 26px;
        height: 26px;
        object-fit: contain;
    }
    .desc-container-content {
        display: flex;
        flex-direction: column;
        width: 100%;
        .content-title {
            display: flex;
            justify-content: space-between;
        }
        .content-subtitle {
            display: flex;
            justify-content: space-between;
        }
        .title {
            font-weight: bold;
            font-size: 15px;
        }
        .subtitle {
            font-size: 11px;
            text-overflow: ellipsis;
            overflow: hidden;
            max-width: 170px;
            text-wrap: nowrap;
        }
        .asset-change1 {
            font-size: 15px;
            text-align: right;
        }
        .asset-change2 {
            font-size: 15px;
            text-align: right;
        }
    }
    .caption-container {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
        gap: 14px;
        .hash {
            color: rgb(110, 110, 110);
            font-size: 10px;
            font-weight: 500;
            width: 120px;
            text-overflow: ellipsis;
            overflow: hidden;
            cursor: pointer;
        }
        .datetime {
            color: rgb(173, 173, 173);
            font-size: 10px;
            font-weight: 500;
        }
    }
`;
