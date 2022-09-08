import * as nearApi from 'near-api-js';

import {
    REF_FINANCE_CONTRACT,
    FT_MINIMUM_STORAGE_BALANCE,
    FT_STORAGE_DEPOSIT_GAS,
    TOKEN_TRANSFER_DEPOSIT,
} from '../../config';
import { parseTokenAmount, formatTokenAmount } from '../../utils/amounts';
import { wallet } from '../../utils/wallet';
import FungibleTokens from '../FungibleTokens';
import { findBestSwapPool } from './utils';

class RefFinanceContract {
    #config = {
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
        gasLimit: {
            swap: '180000000000000',
        },
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

    async getPools({ accountId }) {
        const { maxRequestAmount } = this.#config.pools;
        const contract = await this.#contractInstance(accountId);
        const poolsAmount = await contract.get_number_of_pools();
        const pools = [];

        let requests =
            poolsAmount <= maxRequestAmount
                ? 1
                : Math.floor(poolsAmount / maxRequestAmount);
        const remaningPoolsAmount = poolsAmount - requests * maxRequestAmount;

        if (remaningPoolsAmount) {
            requests += 1;
        }

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
    // @todo remove get_return when findBestSwapPool() would be fixed
    async estimate({ accountId, poolsByIds, tokenIn, amountIn, tokenOut }) {
        const { onChainFTMetadata: { decimals: tokenOutDecimals } } = tokenOut;
        const contract = await this.#contractInstance(accountId);
        const { pool } = findBestSwapPool({ poolsByIds, tokenIn, amountIn, tokenOut });

        const amountOut = await contract.get_return({
            pool_id: pool.poolId,
            token_in: tokenIn.contractName,
            amount_in: parseTokenAmount(amountIn, tokenIn.onChainFTMetadata.decimals, 0),
            token_out: tokenOut.contractName,
        });

        return {
            amountOut: formatTokenAmount(amountOut, tokenOutDecimals, tokenOutDecimals),
            poolId: pool.poolId,
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
        const actions = [];
        const tokenStorage = await FungibleTokens.getStorageBalance({
            contractName: tokenOut.contractName,
            accountId,
        });

        if (!tokenStorage) {
            actions.push(nearApi.transactions.functionCall(
                'storage_deposit',
                {
                    receiver_id: tokenOut.contractName,
                    registration_only: true,
                    account_id: accountId,
                },
                FT_STORAGE_DEPOSIT_GAS,
                FT_MINIMUM_STORAGE_BALANCE
            ));
        }

        const { onChainFTMetadata: { decimals: tokenInDecimals } } = tokenIn;
        const { onChainFTMetadata: { decimals: tokenOutDecimals } } = tokenOut;
        const parsedAmountIn = parseTokenAmount(amountIn, tokenInDecimals, 0);
        const parsedMinAmountOut = parseTokenAmount(minAmountOut, tokenOutDecimals, 0);

        actions.push(
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
                this.#config.gasLimit.swap,
                TOKEN_TRANSFER_DEPOSIT,
            ),
        );

        return actions;
    }
}

export default new RefFinanceContract();
