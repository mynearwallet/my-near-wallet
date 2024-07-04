import React from 'react';
import { useMutation, useQuery } from 'react-query';
import { useSelector } from 'react-redux';
import { BN } from 'bn.js';

import { metapoolService } from '../../../services/metapool/api';
import { METAPOOL_CONTRACT_ID } from '../../../services/metapool/constant';
import FungibleTokens from '../../../services/FungibleTokens';
import { selectAllowedTokens } from '../../../redux/slices/tokens';
import ValidatorBoxItem from '../components/ValidatorBoxItem';
import { liquidUnStake } from '../../../redux/actions/staking';
import { toYoctoNear } from '../../../utils/gasPrice';

type TStakedValidator = {
    // These are optional because we only start getting them after getting list of user's staked validators
    totalBalance: string;
    stakedBalance: string;
    unstakedBalance: string;
    unstakedStatus: boolean;
    earning?: string;
    unclaimedTokenRewards?: TUnclaimedTokenReward[];
} & IValidatorDetails;

type TUnclaimedTokenReward = {
    reward: string;
};

interface IValidatorDetails {
    validatorId: string;
    fee: number;
    isActive: boolean;
    stakedNearAmount: string;
    stakingType: EStakingType;
    pendingUnstakePeriod: string;
    validatorVersion: EValidatorVersion;
    rewardTokens: TTokenApy[];
    apy: number;
    liquidUnstakeFee?: number;
    tokenToReceive?: any;
}

export type TTokenApy = {
    apy: number;
};

export enum EStakingType {
    normal = 'normal',
    liquid = 'liquid',
}

export enum EValidatorVersion {
    normal = 'normal',
    farming = 'farming',
}

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
    // const unstakedBalanceAsync =
    //     staking_async_function.getUnstakedBalanceWithValidator(input);
    // const unstakedStatusAsync =
    //     staking_async_function.getUnstakedStatusWithValidator(input);

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

    console.log({ unstakedBalanceResult });

    const nearToken = tokens.find((token) => token.id == 'near');
    const stNearToken = tokens.find((token) => token.id == METAPOOL_CONTRACT_ID);

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
    const { data } = useQuery({
        queryKey: ['liquidValidator', accountId, allowedTokens],
        queryFn: async () => {
            return getMetapoolValidator({
                accountId,
                tokens: allowedTokens,
            });
        },
        enabled: !!accountId,
    });

    const liquidStakingMutation = useMutation({
        mutationFn: async (amount: string) => {
            return await liquidUnStake({
                contractId: METAPOOL_CONTRACT_ID,
                amountInYocto: new BN(toYoctoNear(amount)).toString(),
            });
        },
        mutationKey: ['liquidUnstakeMutation'],
    });

    return (
        <div>
            OwnedValidators
            <div>{data?.validatorId}</div>
            <ValidatorBoxItem
                validatorId={METAPOOL_CONTRACT_ID}
                amount={data?.stakedBalance}
                fee='2~6'
                active
                withCta
                handleUnstake={() => {
                    liquidStakingMutation.mutate('0.2');
                }}
            />
        </div>
    );
};

export default OwnedValidators;
