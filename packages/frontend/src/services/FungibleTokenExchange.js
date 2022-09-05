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
    // formatTokenAmount,
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
                config[JSON.stringify(token_account_ids)] = {
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
        const contract = await this.#contractInstance(accountId);
        const endIndex = await contract.get_number_of_pools();

        console.log('max pools', endIndex);

        const pools = await contract.get_pools({
            from_index: this.#config.pools.startIndex,
            limit: 1000, // @todo fix gas limit problem when use: endIndex,
        });

        return this.formatPoolsOutput(pools);
    }

    async getReturn({ accountId, poolId, tokenIn, amountIn, tokenOut }) {
        const contract = await this.#contractInstance(accountId);
        const amountOut = await contract.get_return({
            pool_id: poolId,
            token_in: tokenIn.contractName,
            amount_in: format.parseNearAmount(amountIn),
            token_out: tokenOut.contractName,
        });

        return format.formatNearAmount(amountOut);
    }

    async swap({
        accountId,
        poolId,
        tokenIn,
        amountIn,
        tokenOut,
        minAmountOut,
        slippage = 0,
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
        // @todo better naming for 'minAmountOutWithSlippage'
        const minAmountOutWithSlippage = decreaseByPercent(minAmountOut, slippage, tokenOutDecimals);
        // @todo test DAI -> wNEAR: it works only if we decrase decimals by 1
        const parsedMinAmountOut = parseTokenAmount(minAmountOutWithSlippage, tokenOutDecimals, 0);

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

        return wallet.signAndSendTransactions(transactions, accountId);
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
        return params.amountIn;
    }

    async estimateSwap(params) {
        const { tokenIn, tokenOut } = params;

        return this.#exchange.getReturn({
            ...params,
            tokenIn: replaceNearIfNecessary(tokenIn),
            tokenOut: replaceNearIfNecessary(tokenOut),
        });
    }

    async swap(params) {
        if (isNearSwap(params)) {
            return this.swapNear(params);
        }

        // @todo if it's IN or OUT NEAR id => at first wrap/unwrap
        // then continue with Ref contract swap  
        return this.#exchange.swap(params);
    }

    swapNear(params) {
        const { accountId, tokenIn, amountIn } = params;

        return fungibleTokensService.wrapNear({
            accountId,
            amount: amountIn,
            toWNear: tokenIn.contractName !== NEAR_TOKEN_ID,
        });
    }
}

export default new FungibleTokenExchange(new RefFinanceSwapContract());
