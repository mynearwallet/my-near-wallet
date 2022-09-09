import { NEAR_TOKEN_ID } from '../../config';
import { fungibleTokensService } from '../FungibleTokens';
import refFinanceContract from './RefFinanceContract';
import { NEAR_ID, isNearSwap, replaceNearIfNecessary } from './utils';

class FungibleTokenExchange {
    #exchange;

    constructor(exchangeInstance) {
        this.#exchange = exchangeInstance;
    }

    async getData({ account }) {
        return this.#exchange.getData({ account });
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
        const { account, tokenIn, tokenOut, amountIn, minAmountOut } = params;
        let receiverId = '';
        const allActions = [];
        const swapActions = await this.#exchange.getSwapTransactions({
            ...params,
            tokenIn: replaceNearIfNecessary(tokenIn),
            tokenOut: replaceNearIfNecessary(tokenOut),
        });

        const transactions = [];

        if (tokenIn.contractName === NEAR_ID) {
            const { actions } = await fungibleTokensService.getWrapNearTx({
                accountId: account.accountId,
                amount: amountIn,
            });

            receiverId = NEAR_TOKEN_ID;
            allActions.push(...actions, ...swapActions);
            transactions.push({ receiverId, actions: allActions });
        } else if (tokenOut.contractName === NEAR_ID) {
            // const { actions } = await fungibleTokensService.getUnwrapNearTx({ accountId, amount: minAmountOut });
            // allActions.push(...swapActions, ...actions);
            const unwrapTx = await fungibleTokensService.getUnwrapNearTx({
                accountId: account.accountId,
                amount: minAmountOut,
            });

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
        const { account, tokenIn, amountIn } = params;

        return fungibleTokensService.transformNear({
            accountId: account.accountId,
            amount: amountIn,
            toWNear: tokenIn.contractName !== NEAR_TOKEN_ID,
        });
    }
}

export default new FungibleTokenExchange(refFinanceContract);
