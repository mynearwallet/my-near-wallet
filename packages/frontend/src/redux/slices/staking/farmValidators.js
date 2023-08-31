import { createSelector } from 'reselect';

import { calculateAPY } from '../../../utils/staking';
import { createParameterSelector } from '../../selectors/topLevel';
import { selectTokensFiatValueUSD } from '../tokenFiatValues';

const SLICE_NAME = 'staking';
const getValidatorIdParam = createParameterSelector((params) => params.validatorId);
const selectStakingSlice = (state) => state[SLICE_NAME] || {};

// farmingValidators - state
export const selectValidatorsFarmData = createSelector(
    selectStakingSlice,
    (staking) => staking.farmingValidators || {}
);

export const selectValidatorFarmDataByValidatorID = createSelector(
    [selectValidatorsFarmData, getValidatorIdParam],
    (farmingValidators, validatorId) => farmingValidators?.[validatorId] || {}
);

export const selectFarmValidatorAPY = createSelector(
    [selectValidatorFarmDataByValidatorID, selectTokensFiatValueUSD],
    (farmData, tokenPrices) => {
        if (!farmData.poolSummary || !tokenPrices) {
            return null;
        }
        return calculateAPY(farmData.poolSummary, tokenPrices);
    }
);

export const selectFarmValidatorDataIsLoading = createSelector(
    selectValidatorsFarmData,
    (farmingValidators) => Object.values(farmingValidators).some(({ loading }) => loading)
);
