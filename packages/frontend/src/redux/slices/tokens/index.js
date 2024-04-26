import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import BN from 'bn.js';
import set from 'lodash.set';
import { batch } from 'react-redux';
import { createSelector } from 'reselect';

import topTokens from './topTokens.json';
import CONFIG from '../../../config';
import FungibleTokens from '../../../services/FungibleTokens';
import { formatToken } from '../../../utils/token';
import handleAsyncThunkStatus from '../../reducerStatus/handleAsyncThunkStatus';
import initialStatusState from '../../reducerStatus/initialState/initialStatusState';
import selectNEARAsTokenWithMetadata from '../../selectors/crossStateSelectors/selectNEARAsTokenWithMetadata';
import {
    createParameterSelector,
    selectSliceByAccountId,
} from '../../selectors/topLevel';
import { selectSetOfBlacklistedTokenNames } from '../security';
import { selectTokensFiatValueUSD } from '../tokenFiatValues';
import { selectUSDNTokenFiatValueUSD } from '../tokenFiatValues/usd';
import tokensMetadataSlice, {
    getCachedContractMetadataOrFetch,
    selectContractsMetadata,
    selectOneContractMetadata,
} from '../tokensMetadata';

const SLICE_NAME = 'tokens';

const initialState = {
    ownedTokens: {},
    withBalance: {},
};

const initialOwnedTokenState = {
    ...initialStatusState,
    balance: '',
    onChainFTMetadata: {},
    fiatValueMetadata: {},
};

const fetchTokenBalance = createAsyncThunk(
    `${SLICE_NAME}/fetchTokenBalance`,
    async ({ accountId, contractName }, thunkAPI) => {
        const {
            actions: { setTokenBalance },
        } = tokensSlice;
        const { dispatch } = thunkAPI;

        const balance = await FungibleTokens.getBalanceOf({
            contractName,
            accountId,
        });

        dispatch(setTokenBalance({ accountId, contractName, balance }));
    },
    {
        condition: ({ accountId, contractName }, thunkAPI) => {
            const { getState } = thunkAPI;
            if (selectOneTokenLoading(getState(), { accountId, contractName })) {
                return false;
            }
        },
    }
);

async function loadToken(accountId, contractName, thunkAPI, tokens, tokensWithBalance) {
    const { dispatch, getState } = thunkAPI;
    const { tokenFiatValues } = getState();

    const {
        actions: { setTokens, setTokensWithBalance },
    } = tokensSlice;

    const {
        actions: { setContractMetadata },
    } = tokensMetadataSlice;

    try {
        const onChainFTMetadata = await getCachedContractMetadataOrFetch(
            contractName,
            getState()
        );

        const balance = await FungibleTokens.getBalanceOf({
            contractName,
            accountId,
        });

        if (!selectOneContractMetadata(getState(), { contractName })) {
            dispatch(
                setContractMetadata({
                    contractName,
                    metadata: onChainFTMetadata,
                })
            );
        }

        const tokenConfig = {
            contractName,
            balance,
            onChainFTMetadata,
            fiatValueMetadata: tokenFiatValues.tokens[contractName] || {},
        };

        const formattedToken = formatToken(tokenConfig);

        tokens[formattedToken.contractName] = formattedToken;

        if (!new BN(balance).isZero()) {
            tokensWithBalance[formattedToken.contractName] = formattedToken;
        }

        batch(() => {
            dispatch(setTokens({ ...tokens }));
            dispatch(setTokensWithBalance({ ...tokensWithBalance }));
        });

        return {
            formattedToken,
            balance,
        };
    } catch (error) {
        return {
            error,
        };
    }
}

async function loadTokens(accountId, contractNames, thunkAPI, tokens, tokensWithBalance) {
    const contractResults = await Promise.all(
        contractNames.map((contractName) =>
            loadToken(accountId, contractName, thunkAPI, tokens, tokensWithBalance)
        )
    );

    return contractResults;
}

const fetchTokens = createAsyncThunk(
    `${SLICE_NAME}/fetchTokens`,
    async ({ accountId }, thunkAPI) => {
        const tokens = {};

        const tokensWithBalance = {};

        const defaultContractNames = [
            ...new Set([...CONFIG.WHITELISTED_CONTRACTS, ...topTokens]),
        ];

        // await is purposely removed so that redux will not wait for the Promise.all to resolve
        Promise.all([
            loadTokens(
                accountId,
                defaultContractNames,
                thunkAPI,
                tokens,
                tokensWithBalance
            ),
            FungibleTokens.getLikelyTokenContracts({ accountId })
                .then((fetchedContractNames) =>
                    fetchedContractNames.filter(
                        (contractName) => !defaultContractNames.includes(contractName)
                    )
                )
                .then((newContractNames) =>
                    loadTokens(
                        accountId,
                        newContractNames,
                        thunkAPI,
                        tokens,
                        tokensWithBalance
                    )
                ),
        ]);
    }
);

const fetchToken = createAsyncThunk(
    `${SLICE_NAME}/fetchToken`,
    async ({ contractName, accountId }, thunkAPI) => {
        const { dispatch, getState } = thunkAPI;
        const {
            actions: { setContractMetadata },
        } = tokensMetadataSlice;
        try {
            const contractMetadata = await getCachedContractMetadataOrFetch(
                contractName,
                getState()
            );
            if (!selectOneContractMetadata(getState(), { contractName })) {
                dispatch(
                    setContractMetadata({
                        contractName,
                        metadata: contractMetadata,
                    })
                );
            }
            if (accountId) {
                await dispatch(fetchTokenBalance({ accountId, contractName }));
            }
        } catch (e) {
            // Continue loading other likely contracts on failures
            console.warn(`Failed to load FT for ${contractName}`, e);
        }
    }
);

const tokensSlice = createSlice({
    name: SLICE_NAME,
    initialState,
    reducers: {
        setTokens(state, { payload }) {
            set(state, ['ownedTokens'], payload);
        },
        setTokensWithBalance(state, { payload }) {
            set(state, ['withBalance'], payload);
        },
        addToken(state, { payload }) {
            const { contractName, data } = payload;

            set(state, ['ownedTokens', contractName], data);
        },
        addTokenWithBalance(state, { payload }) {
            const { contractName, data } = payload;

            set(state, ['ownedTokens', contractName], data);
            set(state, ['withBalance', contractName], data);
        },
        setTokenBalance(state, { payload }) {
            const { contractName, balance } = payload;

            set(state, ['ownedTokens', contractName, 'balance'], balance);
        },
        setBlacklistedTokens(state, { payload }) {
            set(state, ['blacklisted'], payload);
        },
    },
    extraReducers: (builder) => {
        handleAsyncThunkStatus({
            asyncThunk: fetchTokenBalance,
            buildStatusPath: ({
                meta: {
                    arg: { contractName },
                },
            }) => ['ownedTokens', contractName],
            builder,
        });
    },
});

export default tokensSlice;

export const actions = {
    fetchToken,
    fetchTokens,
    ...tokensSlice.actions,
};
export const reducer = tokensSlice.reducer;

// Top level selectors
const selectTokensSlice = selectSliceByAccountId(SLICE_NAME, initialState);
const selectOwnedTokens = createSelector(
    selectTokensSlice,
    ({ ownedTokens }) => ownedTokens
);
const selectTokensWithBalance = createSelector(
    selectTokensSlice,
    ({ withBalance }) => withBalance
);

const getContractNameParam = createParameterSelector((params) => params.contractName);

export const selectOneTokenFromOwnedTokens = createSelector(
    [selectOwnedTokens, getContractNameParam],
    (ownedTokens, contractName) => ownedTokens[contractName] || initialOwnedTokenState
);

export const selectTokensWithMetadataForAccountId = createSelector(
    [
        selectContractsMetadata,
        selectOwnedTokens,
        selectUSDNTokenFiatValueUSD,
        (_, params) => params.showTokensWithZeroBalance,
    ],
    (allContractMetadata, ownedTokensForAccount, usd, showTokensWithZeroBalance) => {
        let tokenEntries = Object.entries(ownedTokensForAccount);
        if (!showTokensWithZeroBalance) {
            tokenEntries = tokenEntries.filter(
                ([_, { balance }]) => !new BN(balance).isZero()
            );
        }
        return tokenEntries
            .sort(([a], [b]) =>
                allContractMetadata[a]?.name.localeCompare(allContractMetadata[b]?.name)
            )
            .map(([contractName, { balance }]) => ({
                ...initialOwnedTokenState,
                contractName,
                balance,
                onChainFTMetadata: allContractMetadata[contractName] || {},
                fiatValueMetadata: contractName === CONFIG.USN_CONTRACT ? { usd } : {},
            }));
    }
);

const WHITELISTED_TOKENS = [
    'Native USDT',
    'Native USDC',
    'Bridged USDC',
    'Bridged USDT',
    'BLACKDRAGON',
    '$META',
];

export const selectAllowedTokens = createSelector(
    [
        selectTokensFiatValueUSD,
        selectTokensWithBalance,
        selectSetOfBlacklistedTokenNames,
        selectNEARAsTokenWithMetadata,
    ],
    (tokensFiatData, tokensWithBalance, setOfBlacklistedNames, nearConfig) => {
        const tokenList = Object.values(tokensWithBalance).map((tokenData) => ({
            ...tokenData,
            fiatValueMetadata: tokensFiatData[tokenData.contractName] || {},
        }));

        const safeTokenList = tokenList.filter(({ onChainFTMetadata }) => {
            if (WHITELISTED_TOKENS.includes(onChainFTMetadata.symbol)) {
                return true;
            }

            if (onChainFTMetadata.symbol.length >= 10) {
                return false;
            }

            if (!onChainFTMetadata.symbol.match(/^[a-zA-Z0-9]+$/)) {
                return false;
            }

            return true;
        });

        const nearConfigWithName = {
            ...nearConfig,
            contractName: CONFIG.NEAR_ID,
        };
        if (![...setOfBlacklistedNames].length) {
            return [nearConfigWithName, ...safeTokenList];
        }

        const allowedTokens = safeTokenList.filter(
            ({ contractName }) => !setOfBlacklistedNames.has(contractName)
        );

        return [nearConfigWithName, ...allowedTokens];
    }
);

export const selectTokensLoading = createSelector([selectOwnedTokens], (ownedTokens) =>
    Object.entries(ownedTokens).some(([_, { status: { loading } = {} }]) => loading)
);

const selectOneTokenLoading = createSelector(
    [selectOneTokenFromOwnedTokens],
    (token) => token.status.loading
);
