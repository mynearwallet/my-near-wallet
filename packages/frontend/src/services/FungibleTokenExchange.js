import * as nearApi from 'near-api-js';

// import { Mixpanel } from '../../mixpanel';
import { REF_FINANCE_CONTRACT, NEAR_TOKEN_ID } from '../config';
import { wallet } from '../utils/wallet';
import { fungibleTokensService } from './FungibleTokens';

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

    async getReturn({ accountId, poolId, tokenInId, amountIn, tokenOutId }) {
        const contract = await this.#contractInstance(accountId);
        const amountOut = await contract.get_return({
            pool_id: poolId,
            token_in: tokenInId,
            amount_in: format.parseNearAmount(amountIn),
            token_out: tokenOutId,
        });

        return format.formatNearAmount(amountOut);
    }

    async swap({
        accountId,
        poolId,
        tokenInId,
        amountIn,
        tokenOutId,
        minAmountOut,
        slippage, // @todo now to use it here?
    }) {
        const account = await wallet.getAccount(accountId);
        const contract = await new nearApi.Contract(
            account,
            this.#config.contractId,
            this.#config
        );

        return contract.swap({
            actions: [
                {
                    pool_id: poolId,
                    token_in: tokenInId,
                    amount_in: format.parseNearAmount(amountIn),
                    token_out: tokenOutId,
                    min_amount_out: format.parseNearAmount(minAmountOut),
                },
            ],
        });
    }
}

// @todo move it somewhere in configs (check if it exists already)
const NEAR_ID = 'NEAR';

const isNearSwap = (params) => {
    const { tokenInId, tokenOutId } = params;
    const ids = [tokenInId, tokenOutId];

    return ids.includes(NEAR_TOKEN_ID) && ids.includes(NEAR_ID);
};

class FungibleTokenExchange {
    #exchange;
    
    constructor(exchangeInstance) {
        this.#exchange = exchangeInstance;
    }

    async getPools({ accountId }) {
        return this.#exchange.getPools({ accountId });
    }

    async estimateSwap(params) {
        if (isNearSwap(params)) {
            return params.amountIn;
        }

        return this.#exchange.getReturn(params);
    }

    async swap(params) {
        if (isNearSwap(params)) {
            const { accountId, tokenInId, amountIn } = params;

            return fungibleTokensService.wrapNear({
                accountId,
                amount: amountIn,
                toWNear: tokenInId !== NEAR_TOKEN_ID,
            });
        }

        return this.#exchange.swap(params);
    }
}

export default new FungibleTokenExchange(new RefFinanceSwapContract());
