import React, { useEffect } from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';

import NFTBox from './NFTBox';
import FormButton from '../common/FormButton';
import NearCircleIcon from '../svg/NearCircleIcon.js';
import {
    selectLoadingOwnedToken,
    selectTokensWithMetadataForAccountId,
    actions as nftActions,
} from '../../redux/slices/nft';
import LoadingDots from '../common/loader/LoadingDots';

const StyledContainer = styled.div`
    &&& {
        width: 100%;

        @media (max-width: 991px) {
            margin-bottom: 50px;
        }

        .nft-box {
            border-top: 1px solid #f0f0f1;

            :first-of-type {
                border-top: none;
            }
        }

        .empty-state {
            display: flex;
            align-items: center;
            flex-direction: column;
            text-align: center;
            padding: 50px 20px;
            background-color: #f8f8f8;
            border-radius: 8px;

            @media (max-width: 991px) {
                margin-top: 15px;
            }

            @media (min-width: 992px) {
                margin: 15px 15px 50px 15px;
            }

            > div {
                color: #b4b4b4;
            }

            svg {
                margin-bottom: 30px;
            }

            button {
                width: 100%;
                margin: 25px auto 0 auto;
                border-color: #efefef;
                background: #efefef;
            }
        }
    }
`;

const StyledLoadingContainer = styled.div`
    display: flex;
    align-items: center;
    height: 300px;
    max-height: 50vh;
`;

const NFTs = ({ accountId }) => {
    const dispatch = useDispatch();
    const tokens = useSelector((state) =>
        selectTokensWithMetadataForAccountId(state, { accountId })
    );
    const isLoadingTokens = useSelector((state) =>
        selectLoadingOwnedToken(state, { accountId })
    );

    useEffect(() => {
        if (accountId) {
            dispatch(nftActions.fetchNFTs({ accountId }));
        }
    }, [accountId]);

    const ownedTokens = tokens.filter(
        (tokenDetails) =>
            tokenDetails.ownedTokensMetadata && tokenDetails.ownedTokensMetadata.length
    );
    if (isLoadingTokens) {
        return (
            <StyledLoadingContainer>
                <LoadingDots />
            </StyledLoadingContainer>
        );
    }

    if (ownedTokens.length) {
        return (
            <StyledContainer>
                {ownedTokens.map((tokenDetails) => (
                    <NFTBox key={tokenDetails.contractName} tokenDetails={tokenDetails} />
                ))}
            </StyledContainer>
        );
    }

    return (
        <StyledContainer>
            <div className='empty-state'>
                <NearCircleIcon />
                <div>
                    <Translate id='NFTs.emptyState' />
                </div>
                <FormButton
                    color='gray-blue'
                    linkTo='https://awesomenear.com/categories/nft/'
                >
                    <Translate id='exploreApps.exploreApps' />
                </FormButton>
            </div>
        </StyledContainer>
    );
};

export default NFTs;
