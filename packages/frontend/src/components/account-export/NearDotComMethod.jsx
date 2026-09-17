import React from 'react';
import styled from 'styled-components';

const CardFrame = styled.div`
    position: relative;
    display: flex;
    min-width: 0;
    padding: 8px;
    border: 1px dotted #8d7ad7;
    border-radius: 20px;
    transition: transform 150ms;

    &:hover {
        transform: translateY(-2px);
    }

    @media (prefers-reduced-motion: reduce) {
        transition: none;
    }
`;

const TransferButton = styled.button`
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 0;
    min-height: 242px;
    padding: 32px 20px 24px;
    border: 0;
    border-radius: 14px;
    background: radial-gradient(ellipse at 50% 15%, #39306b 0%, #1b172c 40%, #0d0d10 75%);
    color: #fff;
    font-family: inherit;
    text-align: center;
    cursor: pointer;
    transition: transform 150ms, box-shadow 150ms;

    &:hover {
        box-shadow: 0 8px 20px rgb(36 39 42 / 20%);
    }

    &:focus-visible {
        outline: 3px solid #7865e8;
        outline-offset: 3px;
    }

    .export-card__icon {
        display: block;
        width: 68px;
        height: 65px;
        flex: none;
        margin-bottom: 24px;
        color: #d0c7ff;
        filter: drop-shadow(0 0 10px #a18aff) drop-shadow(0 0 22px #7865e8);
    }

    .near-com-title {
        font-size: 20px;
        font-weight: 700;
        line-height: 26px;
    }

    .near-com-description {
        margin-top: 8px;
        color: #b6b3c1;
        font-size: 14px;
        font-weight: 400;
        line-height: 21px;
    }

    .near-com-tag {
        margin-top: 16px;
        padding: 4px 12px;
        border-radius: 999px;
        background: #fff;
        color: #171719;
        font-size: 12px;
        font-weight: 600;
        line-height: 18px;
    }

    @media (prefers-reduced-motion: reduce) {
        transition: none;
    }
`;

function PasskeyIcon() {
    return (
        <svg
            className='export-card__icon'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.6'
            aria-hidden='true'
        >
            <path d='M8 4H5a1 1 0 0 0-1 1v3M16 4h3a1 1 0 0 1 1 1v3M8 20H5a1 1 0 0 1-1-1v-3M16 20h3a1 1 0 0 0 1-1v-3' />
            <path
                d='M8 9v1M16 9v1M12 9v3h-1'
                strokeLinecap='round'
                strokeLinejoin='round'
            />
            <path d='M9 13c.7 1 1.8 1.5 3 1.5s2.3-.5 3-1.5' strokeLinecap='round' />
        </svg>
    );
}

export function NearDotComMethod({ onSelect }) {
    return (
        <CardFrame>
            <TransferButton type='button' onClick={() => onSelect('near-com')}>
                <PasskeyIcon />
                <span className='near-com-title'>Transfer to near.com</span>
                <span className='near-com-description'>
                    One account for 35+ chains, signed in with Passkey and confidential by
                    default.
                </span>
                <span className='near-com-tag'>No seed phrase</span>
            </TransferButton>
        </CardFrame>
    );
}
