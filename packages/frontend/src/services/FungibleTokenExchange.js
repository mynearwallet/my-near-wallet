import * as nearApi from 'near-api-js';

import { REF_FINANCE_CONTRACT } from '../config';
import { wallet } from '../utils/wallet';

class RefFinanceSwapContract {
    #config = {
        contractId: REF_FINANCE_CONTRACT,
        viewMethods: [
            'get_number_of_pools', 
            'get_pools', // params { from_index: number >= 0, limit: number}
            'get_pool',
            'get_return', // params { token_in, amount_in, token_out, fees }
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
            // @note pool has pool_kind: do we also need to filter via type?
            const { token_account_ids } = pool;

            config[JSON.stringify(token_account_ids)] = {
                // set before the "pool content": if the pool has own 'poolId' key it will be rewritten
                poolId,
                ...pool,
            };
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

    async getReturn({ accountId, poolId, tokenInId, amountIn, tokenOut }) {
        const contract = await this.#contractInstance(accountId);

        return contract.get_return({
            pool_id: poolId,
            token_in: tokenInId,
            amount_in: amountIn,
            token_out: tokenOut,
        });
    }

    async swap({
        accountId,
        poolId,
        tokenInId,
        amountIn,
        tokenOut,
        tokenMinAmountOut,
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
                    amount_in: amountIn,
                    token_out: tokenOut,
                    min_amount_out: tokenMinAmountOut,
                },
            ],
        });
    }
}

class FungibleTokenExchange {
    #exchange;
    
    constructor(exchangeInstance) {
        this.#exchange = exchangeInstance;
    }

    async getPools({ accountId }) {
        return this.#exchange.getPools({ accountId });
    }

    async estimateSwap({
        senderId,
        receiverId,
        tokenIn,
        tokenInAmount,
        tokenOut,
    }) {}

    async swap({
        accountId,
        receiverId,
        tokenIn,
        tokenInAmount,
        tokenOut,
        slippage,
    }) {}
}

export default new FungibleTokenExchange(new RefFinanceSwapContract());

