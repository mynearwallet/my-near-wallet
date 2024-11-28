import { BN } from 'bn.js';
import FungibleTokens from '../../../services/FungibleTokens';
import { metapoolService } from '../../../services/metapool/api';
import { METAPOOL_CONTRACT_ID } from '../../../services/metapool/constant';
import { EStakingType, EValidatorVersion, TStakedValidator, TTokenApy } from './type';

export async function getMetapoolValidator({
    accountId,
    tokens,
}): Promise<TStakedValidator> {
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
    const unstakedStatusAsync = FungibleTokens.viewFunctionAccount.viewFunction(
        METAPOOL_CONTRACT_ID,
        'is_account_unstaked_balance_available',
        { account_id: accountId }
    );

    const promises = [
        getMetapoolAsync,
        getTokenBalanceAsync,
        unstakedBalanceAsync,
        unstakedStatusAsync,
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
