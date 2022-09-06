import * as nearApi from 'near-api-js';

// import { Mixpanel } from '../../mixpanel';
import {
    REF_FINANCE_CONTRACT,
    NEAR_TOKEN_ID,
    FT_MINIMUM_STORAGE_BALANCE,
    FT_STORAGE_DEPOSIT_GAS,
    TOKEN_TRANSFER_DEPOSIT,
} from '../config';
import {
    parseTokenAmount,
    decreaseByPercent,
    formatTokenAmount,
    // removeTrailingZeros,
} from '../utils/amounts';
import { wallet } from '../utils/wallet';
import FungibleTokens, { fungibleTokensService } from './FungibleTokens';

const { utils: { format } } = nearApi;

class RefFinanceSwapContract {
    #config = {
        // REF_FINANCE_API_ENDPOINT
        // INDEXER_SERVICE_URL
        // ACCOUNT_HELPER_URL
        contractId: REF_FINANCE_CONTRACT,
        viewMethods: [
            'get_number_of_pools', 
            'get_pools',
            'get_pool',
            'get_return',
        ],
        changeMethods: [
            'swap',
        ],
        pools: {
            startIndex: 0,
            // if we try to get more than +-1600 items at the one request
            // we obtain this error: FunctionCallError(HostError(GasLimitExceeded))
            maxRequestAmount: 1000,
        }
    }

    async #contractInstance(accountId) {
        const account = await wallet.getAccount(accountId);
 
        return await new nearApi.Contract(
            account,
            this.#config.contractId,
            this.#config
        );
    }

    formatPoolsOutput(pools) {
        const config = {};

        pools.forEach((pool, poolId) => {
            const { token_account_ids, shares_total_supply, amounts  } = pool;
            const hasLiquidity = parseInt(shares_total_supply) > 0 && !amounts.includes('0');

            if (hasLiquidity) {
                let mainKey = JSON.stringify(token_account_ids);
                const reverseKey = JSON.stringify(token_account_ids.reverse());

                if (!config[mainKey]) {
                    config[mainKey] = {};
                }
                // Some pools have reverse order of the same tokens.
                // In this condition we check if we already have
                // such tokens and use an existing config key.
                if (config[reverseKey] && Object.keys(config[reverseKey])?.length > 0) {
                    mainKey = reverseKey;
                }

                config[mainKey][poolId] = {
                    // set before the "pool content": if the pool has own 'poolId' key it will be rewritten
                    poolId,
                    ...pool,
                };
            }
        });

        return config;
    }

    async getNumberOfPools(accountId) {
        const contract = await this.#contractInstance(accountId);

        return contract.get_number_of_pools();
    }

    // @todo simplify this method + add some comments
    async getPools({ accountId }) {
        const { maxRequestAmount } = this.#config.pools;
        const contract = await this.#contractInstance(accountId);
        const poolsAmount = await contract.get_number_of_pools();
        let requests =
            poolsAmount <= maxRequestAmount
                ? 1
                : Math.floor(poolsAmount / maxRequestAmount);
        const remaningPoolsAmount = poolsAmount - requests * maxRequestAmount;

        if (remaningPoolsAmount) {
            requests += 1;
        }

        const pools = [];

        for (let i = 1; i <= requests; i++) {
            let start = (i * maxRequestAmount) - maxRequestAmount;
            let limit = maxRequestAmount;

            if (i > 1) {
                start += 1;
            }

            if (remaningPoolsAmount && i === requests) {
                limit = remaningPoolsAmount;
            }

            const chunk = await contract.get_pools({
                from_index: start,
                limit,
            });

            pools.push(...chunk);
        }

        return this.formatPoolsOutput(pools);
    }

    async getPool({ accountId, poolId }) {
        const contract = await this.#contractInstance(accountId);

        return contract.get_pool({ pool_id: poolId });
    }

    async estimate({ accountId, poolId, tokenIn, amountIn, tokenOut }) {
        const contract = await this.#contractInstance(accountId);
        const amountOut = await contract.get_return({
            pool_id: poolId,
            token_in: tokenIn.contractName,
            amount_in: parseTokenAmount(amountIn, tokenIn.onChainFTMetadata.decimals, 0),
            token_out: tokenOut.contractName,
        });

        return {
            amountOut: formatTokenAmount(amountOut, tokenOut.onChainFTMetadata.decimals).toString(),
        };
    }

    async getSwapTransactions({
        accountId,
        poolId,
        tokenIn,
        amountIn,
        tokenOut,
        minAmountOut,
    }) {
        const transactions = [];
        const tokenStorage = await FungibleTokens.getStorageBalance({
            contractName: tokenOut.contractName,
            accountId,
        });

        if (!tokenStorage) {
            transactions.push({
                receiverId: tokenOut.contractName,
                actions: [
                    nearApi.transactions.functionCall(
                        'storage_deposit',
                        {
                            registration_only: true,
                            account_id: accountId,
                        },
                        FT_STORAGE_DEPOSIT_GAS,
                        FT_MINIMUM_STORAGE_BALANCE
                    ),
                ],
            });
        }

        const { onChainFTMetadata: { decimals: tokenInDecimals } } = tokenIn;
        const { onChainFTMetadata: { decimals: tokenOutDecimals } } = tokenOut;
        const parsedAmountIn = parseTokenAmount(amountIn, tokenInDecimals, 0);
        const parsedMinAmountOut = parseTokenAmount(minAmountOut, tokenOutDecimals, 0);

        transactions.push({
            receiverId: tokenIn.contractName,
            actions: [
                nearApi.transactions.functionCall(
                    'ft_transfer_call',
                    {
                        receiver_id: this.#config.contractId,
                        amount: parsedAmountIn,
                        msg: JSON.stringify({
                            force: 0, // @todo what is it for?
                            actions: [
                                // @note in case of routing we add many action objects here
                                {
                                    pool_id: poolId,
                                    token_in: tokenIn.contractName,
                                    token_out: tokenOut.contractName,
                                    amount_in: parsedAmountIn,
                                    min_amount_out: parsedMinAmountOut,
                                },
                            ],
                        }),
                    },
                    // @todo why 180000000000000 for gas?
                    '180000000000000',
                    TOKEN_TRANSFER_DEPOSIT,
                ),
            ],
        });

        return transactions;
    }
}

// @todo move it somewhere in configs (check if it exists already)
const NEAR_ID = 'NEAR';

const isNearSwap = (params) => {
    const { tokenIn, tokenOut } = params;
    const ids = [tokenIn.contractName, tokenOut.contractName];

    return ids.includes(NEAR_TOKEN_ID) && ids.includes(NEAR_ID);
};

const replaceNearIfNecessary = (token) => {
    return token.contractName === NEAR_ID
        ? { ...token, contractName: NEAR_TOKEN_ID }
        : token;
};

class FungibleTokenExchange {
    #exchange;
    
    constructor(exchangeInstance) {
        this.#exchange = exchangeInstance;
    }

    async getPools({ accountId }) {
        return this.#exchange.getPools({ accountId });
    }

    async estimate(params) {
        if (isNearSwap(params)) {
            return this.estimateNearSwap(params);
        }

        return this.estimateSwap(params);
    }

    estimateNearSwap(params) {
        return {
            amountOut: params.amountIn,
        };
    }

    async estimateSwap(params) {
        const { tokenIn, tokenOut } = params;

        return this.#exchange.estimate({
            ...params,
            tokenIn: replaceNearIfNecessary(tokenIn),
            tokenOut: replaceNearIfNecessary(tokenOut),
        });
    }

    async swap(params) {
        if (isNearSwap(params)) {
            return this.swapNear(params);
        }

        const { accountId, tokenIn, tokenOut, /* amountIn */ } = params;
        const transactions = [];
        const swapTransactions = await this.#exchange.getSwapTransactions({
            ...params,
            tokenIn: replaceNearIfNecessary(tokenIn),
            tokenOut: replaceNearIfNecessary(tokenOut),
        });
        // @todo how to execute many transactions? For now it does not work
        // if (tokenIn.contractName === NEAR_ID) {
        //     const wrapTx = await fungibleTokensService.getWrapNearTx({ accountId, amount: amountIn });

        //     transactions.push(wrapTx, ...swapTransactions);
        // } else if (tokenOut.contractName === NEAR_ID) {
        //     const unwrapTx = await fungibleTokensService.getUnwrapNearTx({ accountId, amount: amountIn });

        //     transactions.push(...swapTransactions, unwrapTx);
        // }
        transactions.push(...swapTransactions);

        return wallet.signAndSendTransactions(transactions, accountId);
    }

    swapNear(params) {
        const { accountId, tokenIn, amountIn } = params;

        return fungibleTokensService.transformNear({
            accountId,
            amount: amountIn,
            toWNear: tokenIn.contractName !== NEAR_TOKEN_ID,
        });
    }
}

export default new FungibleTokenExchange(new RefFinanceSwapContract());
