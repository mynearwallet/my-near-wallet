import * as nearApi from 'near-api-js';

import { 
    // REF_FINANCE_API_ENDPOINT,
    REF_FINANCE_CONTRACT,
} from '../config';
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
            // swap params {
            //     token_in: id,
            //     amount_in: number,
            //     token_out: id,
            //     min_amount_out: number,
            //     admin_fee: ?,
            // }
        ],
    }

    async #contractInstance(accountId) {
        const account = await wallet.getAccount(accountId);
 
        return await new nearApi.Contract(
            account,
            this.#config.contractId,
            this.#config
        );
    }

    async getNumberOfPools(accountId) {
        const contract = await this.#contractInstance(accountId);

        return contract.get_number_of_pools();
    }

    async getPools({ accountId, fromIndex, maxAmount }) {
        const contract = await this.#contractInstance(accountId);

        return contract.get_pools({ from_index: fromIndex, limit: maxAmount });
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
    #exchange
    
    constructor(exchangeInstance) {
        this.#exchange = exchangeInstance;
    }

    async idk(accountId) {
        const result = await this.#exchange.swap({
            accountId,
            poolId: 84,
            tokenInId: 'wrap.testnet',
            amountIn: nearApi.utils.format.parseNearAmount('0.01'),
            tokenOut: 'dai.fakes.testnet',
            tokenMinAmountOut: nearApi.utils.format.parseNearAmount('1'),
        });
        // @todo why? Check balances
        // swap result: ERR10_ACC_NOT_REGISTERED = E10: account not registered
        // error from the account_deposit.rs

        console.log('result', result);
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

const instance = new FungibleTokenExchange(new RefFinanceSwapContract());

// instance.idk('');

export default instance;

