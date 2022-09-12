import * as nearApi from 'near-api-js';

import {
    NEAR_TOKEN_ID,
    FT_MINIMUM_STORAGE_BALANCE,
    FT_STORAGE_DEPOSIT_GAS,
} from '../../config';
import FungibleTokens, { fungibleTokensService } from '../FungibleTokens';
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

        const { tokenIn, tokenOut } = params;

        if (tokenIn.contractName === NEAR_ID) {
            return this.swapNearToToken(params);
        }

        if (tokenIn.contractName === NEAR_TOKEN_ID) {
            return this.swapWNearToToken(params);
        }

        if (tokenOut.contractName === NEAR_ID) {
            return this.swapTokenToNear(params);
        }

        if (tokenOut.contractName === NEAR_TOKEN_ID) {
            return this.swapTokenToWNear(params);
        }

        return this.swapTokenToToken(params);
    }

    swapNear(params) {
        const { account, tokenIn, amountIn } = params;

        return fungibleTokensService.transformNear({
            accountId: account.accountId,
            amount: amountIn,
            toWNear: tokenIn.contractName !== NEAR_TOKEN_ID,
        });
    }

    async swapNearToToken(params) {
        const { account, tokenIn, tokenOut, amountIn } = params;
        const transactions = [];
        const depositTransactions = await this.getDepositTransactions(
            account.accountId,
            [tokenOut.contractName]
        );

        if (depositTransactions) {
            transactions.push(...depositTransactions);
        }

        const wrapNear = await fungibleTokensService.getWrapNearTx({
            accountId: account.accountId,
            amount: amountIn,
        });
        const swapActions = await this.#exchange.getSwapActions({
            ...params,
            tokenIn: replaceNearIfNecessary(tokenIn),
        });

        transactions.push(wrapNear, {
            receiverId: NEAR_TOKEN_ID,
            actions: swapActions,
        });

        return this.#processTransactions(account, transactions);
    }

    async swapWNearToToken(params) {
        const { account, tokenOut } = params;
        const transactions = [];
        const depositTransactions = await this.getDepositTransactions(
            account.accountId,
            [tokenOut.contractName]
        );

        if (depositTransactions) {
            transactions.push(...depositTransactions);
        }

        const swapActions = await this.#exchange.getSwapActions(params);

        transactions.push({
            receiverId: NEAR_TOKEN_ID,
            actions: swapActions,
        });

        return this.#processTransactions(account, transactions);
    }

    // @todo add NEAR in the token list and check this flow
    async swapTokenToNear(params) {
        const { account, tokenIn, tokenOut, amountIn } = params;
        const transactions = [];
        const depositTransactions = await this.getDepositTransactions(
            account.accountId,
            [tokenOut.contractName]
        );

        if (depositTransactions) {
            transactions.push(...depositTransactions);
        }

        const swapActions = await this.#exchange.getSwapActions({
            ...params,
            tokenOut: replaceNearIfNecessary(tokenOut),
        });
        const unwrapNear = await fungibleTokensService.getUnwrapNearTx({
            accountId: account.accountId,
            amount: amountIn,
        });

        transactions.push(
            {
                receiverId: tokenIn.contractName,
                actions: swapActions,
            },
            unwrapNear
        );

        return this.#processTransactions(account, transactions);
    }

    async swapTokenToWNear(params) {
        const { account, tokenIn, tokenOut } = params;
        const transactions = [];
        const depositTransactions = await this.getDepositTransactions(
            account.accountId,
            [tokenOut.contractName]
        );

        if (depositTransactions) {
            transactions.push(...depositTransactions);
        }

        const swapActions = await this.#exchange.getSwapActions(params);

        transactions.push({
            receiverId: tokenIn.contractName,
            actions: swapActions,
        });

        return this.#processTransactions(account, transactions);
    }

    async swapTokenToToken(params) {
        const { account, tokenIn, tokenOut } = params;
        const transactions = [];
        const depositTransactions = await this.getDepositTransactions(
            account.accountId,
            [tokenIn.contractName, tokenOut.contractName]
        );

        if (depositTransactions) {
            transactions.push(...depositTransactions);
        }

        const swapActions = await this.#exchange.getSwapActions(params);

        transactions.push({
            receiverId: tokenIn.contractName,
            actions: swapActions,
        });

        return this.#processTransactions(account, transactions);
    }

    async getDepositTransactions(accountId, contracts) {
        const txs = [];

        for (const name of contracts) {
            const tokenOutStorage = await FungibleTokens.getStorageBalance({
                contractName: name,
                accountId,
            });

            if (!tokenOutStorage) {
                txs.push({
                    receiverId: name,
                    actions: [
                        nearApi.transactions.functionCall(
                            'storage_deposit',
                            {
                                account_id: accountId,
                                signer_id: accountId,
                                receiver_id: name,
                                registration_only: true,
                            },
                            FT_STORAGE_DEPOSIT_GAS,
                            FT_MINIMUM_STORAGE_BALANCE
                        ),
                    ],
                });
            }
        }

        return txs.length ? txs : null;
    }

    async #processTransactions(account, txs) {
        const outcome = [];

        for (const tx of txs) {
            const txResult = await account.signAndSendTransaction(tx);

            outcome.push(txResult);
        }

        return outcome;
    }
}

export default new FungibleTokenExchange(refFinanceContract);
