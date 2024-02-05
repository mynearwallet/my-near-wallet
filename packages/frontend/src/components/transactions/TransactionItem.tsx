import dayjs from 'dayjs';
import React from 'react';
import styled from 'styled-components';

import { TransactionItemComponent } from '../../redux/slices/transactionHistory/type';
import {
    getPrefixByDir,
    transPico2Date,
} from '../../redux/slices/transactionHistory/utils';
import classNames from '../../utils/classNames';
import Card from '../common/styled/Card.css';

export enum ETxDirection {
    receive = 'receive',
    send = 'send',
    self = 'self',
    unknown = 'unknown',
}

export const TransactionItem = (
    props: TransactionItemComponent & {
        onClick: () => void;
    }
) => {
    return (
        <StyledContainer onClick={props.onClick}>
            <div className='desc-container'>
                <img className='image' src={props.image} alt='transaction-icon' />
                <div className='desc-container-content'>
                    <div className='content-title'>
                        <div className='title'>{props.title}</div>
                        {!!props.assetChangeText && (
                            <div
                                className={classNames([
                                    'asset-change1',
                                    { 'text-green': props.dir !== ETxDirection.send },
                                ])}
                            >
                                {getPrefixByDir(props.dir)}
                                {props.assetChangeText}
                            </div>
                        )}
                    </div>
                    <div className='content-subtitle'>
                        <div className='subtitle'>{props.subtitle}</div>
                        {!!props.assetChangeText2 && (
                            <div className='asset-change2'>
                                -{props.assetChangeText2}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className='caption-container'>
                <div className='hash'>{props.transactionHash}</div>
                <div className='datetime'>
                    {dayjs(transPico2Date(props.dateTime)).format('YYYY-MM-DD HH:mm')}
                </div>
            </div>
        </StyledContainer>
    );
};

const StyledContainer = styled(Card)`
    display: flex;
    flex-direction: column;
    margin: 10px 0;
    padding: 15px 20px;
    cursor: pointer;
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
            word-break: break-all;
            overflow: hidden;
            max-width: 170px;
            text-wrap: nowrap;
        }
        .asset-change1 {
            font-size: 15px;
            text-align: right;
            &.text-green {
                color: green;
            }
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
            max-width: 50%;
            text-overflow: ellipsis;
            overflow: hidden;
            cursor: pointer;
        }
        .datetime {
            color: rgb(173, 173, 173);
            font-size: 10px;
            font-weight: 500;
            text-align: right;
        }
    }
`;
