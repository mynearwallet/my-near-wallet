import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import BinanceLogo from '../../images/binance-logo.svg';
import HuobiLogo from '../../images/huobi-logo.svg';
import LiqualityLogo from '../../images/liquality-logo.svg';
import OkCoinLogo from '../../images/ok-coin-logo.svg';
import OkexLogo from '../../images/okex-logo.svg';
import Modal from '../common/modal/Modal';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 0 30px 0;

    h2 {
        color: #72727a !important;
        font-size: 16px !important;
        font-weight: 400 !important;
        line-height: 150%;
        text-align: center;
        margin: 20px 0 30px 0;
    }

    a {
        border: 2px solid #f5f5f3;
        border-radius: 8px;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 110px;
        margin: 10px 0;
        transition: 100ms;

        :hover {
            border-color: #8fcdff;
            background-color: #f0f9ff;
        }

        img {
            max-height: 35px;
        }
    }
`;

const WhereToBuyNearModal = ({ open, onClose }) => {
    return (
        <Modal
            id='where-to-buy-modal'
            isOpen={open}
            onClose={onClose}
            closeButton='true'
            modalSize='md'
        >
            <Container>
                <h1>
                    <Translate id='account.createImplicit.pre.whereToBuy.title' />
                </h1>
                <h2>
                    <Translate id='account.createImplicit.pre.whereToBuy.desc' />
                </h2>
                <a href='https://www.binance.com/' target='_blank' rel='noreferrer'>
                    <img src={BinanceLogo} alt='BINANCE' />
                </a>
                <a href='https://www.huobi.com/' target='_blank' rel='noreferrer'>
                    <img src={HuobiLogo} alt='HUOBI' />
                </a>
                <a href='https://www.okex.com/' target='_blank' rel='noreferrer'>
                    <img src={OkexLogo} alt='OKEX' />
                </a>
                <a href='https://liquality.io/' target='_blank' rel='noreferrer'>
                    <img src={LiqualityLogo} alt='LIQUALITY' />
                </a>
                <a href='https://www.okcoin.com/' target='_blank' rel='noreferrer'>
                    <img src={OkCoinLogo} alt='OKCOIN' />
                </a>
            </Container>
        </Modal>
    );
};

export default WhereToBuyNearModal;
