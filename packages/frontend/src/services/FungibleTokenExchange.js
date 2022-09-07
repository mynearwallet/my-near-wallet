import Big from 'big.js';
import * as nearApi from 'near-api-js';

// import { Mixpanel } from '../../mixpanel';
import {
    REF_FINANCE_CONTRACT,
    NEAR_TOKEN_ID,
    FT_MINIMUM_STORAGE_BALANCE,
    FT_STORAGE_DEPOSIT_GAS,
    TOKEN_TRANSFER_DEPOSIT,
} from '../config';
import { parseTokenAmount, formatTokenAmount } from '../utils/amounts';
import { wallet } from '../utils/wallet';
import FungibleTokens, { fungibleTokensService } from './FungibleTokens';

const FEE_DIVISOR = 10_000;

// @todo check this calculations
/* @note original method from the simple pool contract
fn internal_get_return(
    &self,
    token_in: usize,
    amount_in: Balance,
    token_out: usize,
) -> Balance {
    let in_balance = U256::from(self.amounts[token_in]);
    let out_balance = U256::from(self.amounts[token_out]);
    assert!(
        in_balance > U256::zero()
            && out_balance > U256::zero()
            && token_in != token_out
            && amount_in > 0,
        "{}", ERR76_INVALID_PARAMS
    );
    let amount_with_fee = U256::from(amount_in) * U256::from(FEE_DIVISOR - self.total_fee);
    (amount_with_fee * out_balance / (U256::from(FEE_DIVISOR) * in_balance + amount_with_fee))
        .as_u128()
}
*/
const estimatePoolInfo = ({ pool, tokenIn, tokenOut, amountIn }) => {
    const { onChainFTMetadata: { decimals: tokenInDecimals } } = tokenIn;
    const { total_fee, token_account_ids, amounts } = pool;
    const tokenInfo = {
        [token_account_ids[0]]: amounts[0],
        [token_account_ids[1]]: amounts[1],
    };

    const allocation = parseTokenAmount(amountIn, tokenInDecimals, 0);
    const inAmountWithFee = Big(allocation).times(FEE_DIVISOR - total_fee).toFixed(0);
    const reserveIn = tokenInfo[tokenIn.contractName];
    const reserveOut = tokenInfo[tokenOut.contractName];

    const amountOut = Big(Big(inAmountWithFee).times(reserveOut))
        .div(Big(FEE_DIVISOR).times(reserveIn).plus(inAmountWithFee))
        .toFixed(0);

    return { pool, amountOut };
};

const findBestSwapPool = ({ poolsByIds, tokenIn, amountIn, tokenOut }) => {
    let bestPool;
    let bestAmountOut;

    Object.values(poolsByIds)
        .map((pool) =>
            estimatePoolInfo({
                pool,
                tokenIn,
                tokenOut,
                amountIn,
            })
        )
        .forEach(({ pool, amountOut }) => {
            if (!bestPool || amountOut > bestAmountOut) {
                bestPool = pool;
                bestAmountOut = amountOut;
            }
        });

    return { pool: bestPool, amountOut: bestAmountOut };
};

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
    // try FungibleTokens.viewFunctionAccount.viewFunction(contract, method, args)
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


    async estimate({ accountId, poolsByIds, tokenIn, amountIn, tokenOut }) {        // const { pool, amountOut } = findBestSwapPool({ poolsByIds, tokenIn, amountIn, tokenOut });
        const { poolId } = Object.values(poolsByIds)[0];

        const contract = await this.#contractInstance(accountId);
        const amountOut = await contract.get_return({
            pool_id: poolId,
            token_in: tokenIn.contractName,
            amount_in: parseTokenAmount(amountIn, tokenIn.onChainFTMetadata.decimals, 0),
            token_out: tokenOut.contractName,
        });

        return {
            amountOut: formatTokenAmount(amountOut, tokenOut.onChainFTMetadata.decimals).toString(),
            poolId //: pool.poolId,
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
        // @todo move this constant somewhere else
        const SWAP_GAS_LIMII = '180000000000000';

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
                SWAP_GAS_LIMII,
                TOKEN_TRANSFER_DEPOSIT,
            ),
        );

        return actions;
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
        // @todo for now we can swap NEAR -> <TOKEN> in one batched transaction,
        // but we cannot swap the same way in the other direction (<TOKEN> -> NEAR);
        // so when we swap "to NEAR" it uses 2 transactions (1st for swap, 2nd for unwrapping);
        // need to find out how to use batched tx in the second flow;
        const { accountId, tokenIn, tokenOut, amountIn, minAmountOut } = params;
        const account = await wallet.getAccount(accountId);
        let receiverId = '';
        const allActions = [];
        const swapActions = await this.#exchange.getSwapTransactions({
            ...params,
            tokenIn: replaceNearIfNecessary(tokenIn),
            tokenOut: replaceNearIfNecessary(tokenOut),
        });

        const transactions = [];

        if (tokenIn.contractName === NEAR_ID) {
            const { actions } = await fungibleTokensService.getWrapNearTx({ accountId, amount: amountIn });

            receiverId = NEAR_TOKEN_ID;
            allActions.push(...actions, ...swapActions);
            transactions.push({ receiverId, actions: allActions });
        } else if (tokenOut.contractName === NEAR_ID) {
            // const { actions } = await fungibleTokensService.getUnwrapNearTx({ accountId, amount: minAmountOut });
            // allActions.push(...swapActions, ...actions);
            const unwrapTx = await fungibleTokensService.getUnwrapNearTx({ accountId, amount: minAmountOut });

            receiverId = tokenIn.contractName;
            allActions.push(...swapActions);
            transactions.push({ receiverId, actions: allActions }, unwrapTx);
        } else {
            receiverId = tokenIn.contractName;
            allActions.push(...swapActions);
            transactions.push({ receiverId, actions: allActions });
        }

        // @todo need to test this method. It doesn't work here with many TXs
        // wallet.signAndSendTransactions(transactions, accountId);

        const outcome = [];

        for (const tx of transactions) {
            const txResult = await account.signAndSendTransaction(tx);

            outcome.push(txResult);
        }

        return outcome;
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
