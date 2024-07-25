import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useSelector } from 'react-redux';
import { BN } from 'bn.js';

import { metapoolService } from '../../../services/metapool/api';
import { METAPOOL_CONTRACT_ID } from '../../../services/metapool/constant';
import FungibleTokens from '../../../services/FungibleTokens';
import { selectAllowedTokens } from '../../../redux/slices/tokens';
import ValidatorBoxItem from '../components/ValidatorBoxItem';
import ModalUnstake from './ModalUnstake';
import { formatNearAmount } from '../../common/balance/helpers';
import LoadingDots from '../../common/loader/LoadingDots';
import styled from 'styled-components';
import { EStakingType, EValidatorVersion, TStakedValidator, TTokenApy } from './type';

async function getMetapoolValidator({ accountId, tokens }): Promise<TStakedValidator> {
    const getMetapoolAsync = metapoolService.getMetrics();
    const getTokenBalanceAsync = FungibleTokens.getBalanceOf({
        contractName: METAPOOL_CONTRACT_ID,
        accountId,
    });

    const unstakedBalanceAsync = FungibleTokens.viewFunctionAccount.viewFunction(
        METAPOOL_CONTRACT_ID,
        'get_account_unstaked_balance',
        { account_id: accountId }
    );

    const promises = [
        getMetapoolAsync,
        getTokenBalanceAsync,
        unstakedBalanceAsync,
        // unstakedStatusAsync,
    ];

    const [
        getMetapoolMetricsResult,
        getTokenBalanceResult,
        unstakedBalanceResult,
        unstakedStatusResult,
    ] = await Promise.all(promises);

    const nearToken = tokens.find((token) => token.contractName === 'NEAR');
    const stNearToken = tokens.find(
        (token) => token.contractName === METAPOOL_CONTRACT_ID
    );

    const metapoolValidator: TStakedValidator = {
        validatorId: METAPOOL_CONTRACT_ID,
        isActive: true,
        stakedNearAmount: getMetapoolMetricsResult.total_actually_staked.toFixed(2),
        stakingType: EStakingType.liquid,
        pendingUnstakePeriod: '2 ~ 6 days',
        validatorVersion: EValidatorVersion.normal,
        rewardTokens: [
            {
                ...nearToken,
                apy: getMetapoolMetricsResult.st_near_30_day_apy,
            } as TTokenApy,
        ],
        apy: getMetapoolMetricsResult.st_near_30_day_apy,
        fee: 0,
        liquidUnstakeFee: getMetapoolMetricsResult.nslp_current_discount,
        tokenToReceive: stNearToken,
        totalBalance: new BN(getTokenBalanceResult)
            .add(new BN(unstakedBalanceResult))
            .toString(),
        stakedBalance: getTokenBalanceResult,
        unstakedBalance: unstakedBalanceResult,
        unstakedStatus: unstakedStatusResult,
    };

    return metapoolValidator;
}

const OwnedValidators = ({ accountId }: { accountId: string }) => {
    const allowedTokens = useSelector(selectAllowedTokens);
    const {
        data: liquidValidatorData,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ['liquidValidator', accountId, allowedTokens],
        queryFn: async () => {
            return getMetapoolValidator({
                accountId,
                tokens: allowedTokens,
            });
        },
        enabled: !!accountId,
    });

    console.log({ liquidValidatorData });

    const [isModalVisible, setModalVisible] = useState(false);

    if (isLoading) {
        return <LoadingDots />;
    }

    if (!liquidValidatorData) {
        return null;
    }

    return (
        <Container>
            {!!+liquidValidatorData?.stakedBalance && (
                <ValidatorBoxItem
                    validatorId={METAPOOL_CONTRACT_ID}
                    amountString={
                        liquidValidatorData
                            ? `${formatNearAmount(liquidValidatorData.stakedBalance)} ${
                                  liquidValidatorData?.tokenToReceive?.onChainFTMetadata
                                      ?.symbol || ''
                              }`
                            : ''
                    }
                    fee='2~6'
                    active
                    withCta
                    info={
                        liquidValidatorData?.unstakedBalance && (
                            <div className='validator-box-item__info'>
                                You are unstaking{' '}
                                {formatNearAmount(liquidValidatorData.unstakedBalance)}{' '}
                                STNEAR and it usually takes 2 ~ 6 days to unstake
                            </div>
                        )
                    }
                    handleUnstake={() => {
                        setModalVisible(true);
                    }}
                />
            )}
            {!!isModalVisible && (
                <ModalUnstake
                    isModalVisible={isModalVisible}
                    setModalVisible={setModalVisible}
                    liquidValidatorData={liquidValidatorData}
                    onUnstakeCompleted={refetch}
                />
            )}
        </Container>
    );
};

export default OwnedValidators;

const Container = styled.div`
    .validator-box-item__info {
        border: 1px solid #ddd;
        padding: 0.8em 1em;
        margin: 1em;
        border-radius: 4px;
    }
`;
