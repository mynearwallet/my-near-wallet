import * as nearApi from 'near-api-js';

import { REF_FINANCE_CONTRACT, TOKEN_TRANSFER_DEPOSIT } from '../../config';
import { parseTokenAmount, formatTokenAmount } from '../../utils/amounts';
import { findBestSwapPool, formatTotalFee } from './utils';

const contractConfig = {
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
        // Max amount of pools in one request.
        // If we try to get more than +-1600 items at one point we
        // obtain a error: FunctionCallError(HostError(GasLimitExceeded))
        maxRequestAmount: 1000,
    }
};

const DEV_CONTRACT_ID_REGEXP = /^dev-[0-9]+-[0-9]+$/;

class RefFinanceContract {
    async getData({ account }) {
        const { maxRequestAmount } = contractConfig.pools;
        const contract = await this._newContract(account);
        const totalNumberOfPools = await contract.get_number_of_pools();
        const pools = [];

        let numberOfRequests =
            totalNumberOfPools <= maxRequestAmount
                ? 1
                : Math.floor(totalNumberOfPools / maxRequestAmount);
        const remaningNumberOfPools = totalNumberOfPools - numberOfRequests * maxRequestAmount;

        if (remaningNumberOfPools) {
            numberOfRequests += 1;
        }

        for (let req = 1; req <= numberOfRequests; req++) {
            let startPoolsIndex = (req * maxRequestAmount) - maxRequestAmount;
            let poolsAmountLimit = maxRequestAmount;

            if (req > 1) {
                startPoolsIndex += 1;
            }

            if (req === numberOfRequests && remaningNumberOfPools) {
                poolsAmountLimit = remaningNumberOfPools;
            }

            try {
                const chunk = await contract.get_pools({
                    from_index: startPoolsIndex,
                    limit: poolsAmountLimit,
                });

                pools.push(...chunk);
            } catch (error) {
                console.error(
                    'RefFinanceContract: Error in the request for a part of pools',
                    error
                );
            }
        }

        return this._formatPoolsData(pools);
    }

    // @todo remove get_return when findBestSwapPool() would be fixed
    async estimate({
        account,
        poolsByIds,
        tokenInId,
        tokenInDecimals,
        amountIn,
        tokenOutId,
        tokenOutDecimals,
    }) {
        const contract = await this._newContract(account);
        const { pool } = findBestSwapPool({
            poolsByIds,
            tokenInId,
            tokenInDecimals,
            amountIn,
            tokenOutId,
            tokenOutDecimals,
        });
        const { poolId, total_fee } = pool;

        const amountOut = await contract.get_return({
            pool_id: poolId,
            token_in: tokenInId,
            amount_in: parseTokenAmount(amountIn, tokenInDecimals),
            token_out: tokenOutId,
        });

        return {
            amountOut: formatTokenAmount(amountOut, tokenOutDecimals, tokenOutDecimals),
            poolId,
            swapFee: formatTotalFee(total_fee),
        };
    }

    async getSwapActions({
        poolId,
        tokenInId,
        tokenInDecimals,
        amountIn,
        tokenOutId,
        tokenOutDecimals,
        minAmountOut,
    }) {
        const actions = [];
        const parsedAmountIn = parseTokenAmount(amountIn, tokenInDecimals);
        const parsedMinAmountOut = parseTokenAmount(minAmountOut, tokenOutDecimals);

        actions.push(
            nearApi.transactions.functionCall(
                'ft_transfer_call',
                {
                    receiver_id: contractConfig.contractId,
                    amount: parsedAmountIn,
                    msg: JSON.stringify({
                        force: 0, // @todo what is it for?
                        actions: [
                            // @note in case of multihop swaps we add extra objects here
                            {
                                pool_id: poolId,
                                token_in: tokenInId,
                                token_out: tokenOutId,
                                amount_in: parsedAmountIn,
                                min_amount_out: parsedMinAmountOut,
                            },
                        ],
                    }),
                },
                contractConfig.gasLimit.swap,
                TOKEN_TRANSFER_DEPOSIT,
            ),
        );

        return actions;
    }

    _formatPoolsData(inputPools) {
        const pools = {};
        const tokens = new Set();

        inputPools.forEach((pool, poolId) => {
            const { token_account_ids, shares_total_supply, amounts  } = pool;
            const hasLiquidity = parseInt(shares_total_supply) > 0 && !amounts.includes('0');

            if (hasLiquidity) {
                const isToken0Dev = token_account_ids[0].match(DEV_CONTRACT_ID_REGEXP);
                const isToken1Dev = token_account_ids[1].match(DEV_CONTRACT_ID_REGEXP);

                if (!isToken0Dev) {
                    tokens.add(token_account_ids[0]);
                }
                if (!isToken1Dev) {
                    tokens.add(token_account_ids[1]);
                }

                let mainKey = JSON.stringify(token_account_ids);
                const reverseKey = JSON.stringify(token_account_ids.reverse());

                if (!pools[mainKey]) {
                    pools[mainKey] = {};
                }
                // Some pools have reverse order of the same tokens.
                // In this condition we check if we already have
                // such tokens and use an existing pools key.
                if (pools[reverseKey] && Object.keys(pools[reverseKey])?.length > 0) {
                    mainKey = reverseKey;
                }

                pools[mainKey][poolId] = {
                    // set before the "...pool": if the pool has own 'poolId' key it will be rewritten
                    poolId,
                    ...pool,
                };
            }
        });

        return { pools, tokens: [...tokens] };
    }

    async _newContract(account) {
        return await new nearApi.Contract(
            account,
            contractConfig.contractId,
            contractConfig
        );
    }
}

export default new RefFinanceContract();
