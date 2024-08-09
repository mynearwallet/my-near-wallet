export type TStakedValidator = {
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
