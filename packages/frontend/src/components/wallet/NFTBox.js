import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import LoadMoreButtonWrapper from './LoadMoreButtonWrapper';
import CONFIG from '../../config';
import { redirectTo } from '../../redux/actions/account';
import isDataURL from '../../utils/isDataURL';
import { NFTMedia } from '../nft/NFTMedia';
import DefaultTokenIcon from '../svg/DefaultTokenIcon';
const StyledContainer = styled.div`
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
    padding: 15px 14px;

    :first-of-type {
        padding: 0 14px 15px 14px;
    }

    @media (max-width: 767px) {
        margin: 0 -14px;
    }

    @media (min-width: 992px) {
        padding: 15px 20px;

        :first-of-type {
            padding: 0 20px 15px 20px;
        }
    }

    .nft-header {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        padding: 20px 0;
        margin-bottom: 12px;
    }

    .symbol {
        width: 33px;
        height: 33px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;

        img,
        svg {
            height: 32px;
            width: 32px;
        }
    }

    .desc {
        display: flex;
        align-items: center;
        margin-left: 14px;

        a {
            font-weight: 700;
            font-size: 16px;
            color: #24272a;
        }

        span {
            color: #72727a;
            background-color: #f0f0f1;
            font-size: 14px;
            font-weight: 600;
            min-width: 26px;
            min-height: 26px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: 10px;
        }
    }

    .title {
        cursor: pointer;
        text-align: center;
        color: #393434;
    }

    .tokens {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 30px 20px;
        @media (max-width: 991px) {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    .nft {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        color: black;

        a {
            color: inherit;
        }
    }

    .creator {
        span {
            font-size: 14px;
            line-height: 150%;
            color: #a2a2a8;
        }
    }

    .nft img,
    .nft video {
        width: 100%;
        margin-bottom: 8px;
        cursor: pointer;
        object-fit: cover;
        height: 240px;
        border-radius: 8px;
    }

    @media (min-width: 992px) {
        .nft img {
            height: 170px;
        }
    }
`;

const NFTBox = ({ tokenDetails }) => {
    const {
        contractName,
        contractMetadata: { icon, name },
        ownedTokensMetadata,
        numberByContractName,
    } = tokenDetails;
    const dispatch = useDispatch();

    return (
        <StyledContainer className='nft-box'>
            <div className='nft-header'>
                <div className='symbol'>
                    {icon && isDataURL(icon) ? (
                        <img src={icon} alt={name} />
                    ) : (
                        <DefaultTokenIcon />
                    )}
                </div>
                <div className='desc'>
                    <a
                        href={`${CONFIG.EXPLORER_URL}/address/${contractName}`}
                        title={name}
                        target='_blank'
                        rel='noopener noreferrer'
                    >
                        {name}
                    </a>
                    <span>{numberByContractName}</span>
                </div>
            </div>
            {ownedTokensMetadata && (
                <div className='tokens'>
                    {ownedTokensMetadata.map(
                        ({ token_id, metadata: { mediaUrl, title } }, index) => {
                            return (
                                <div
                                    className='nft'
                                    key={token_id}
                                    onClick={() =>
                                        dispatch(
                                            redirectTo(
                                                `/nft-detail/${contractName}/${token_id}`
                                            )
                                        )
                                    }
                                >
                                    <NFTMedia
                                        mediaUrl={mediaUrl}
                                        autoPlay={index === 0}
                                    />
                                    <p className='title'>{title}</p>
                                </div>
                            );
                        }
                    )}
                </div>
            )}
            <LoadMoreButtonWrapper contractName={contractName} />
        </StyledContainer>
    );
};

export default NFTBox;
