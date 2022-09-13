import * as nearApi from 'near-api-js';

import {
    NEAR_ID,
    NEAR_TOKEN_ID,
    FT_MINIMUM_STORAGE_BALANCE,
    FT_STORAGE_DEPOSIT_GAS,
} from '../../config';
import FungibleTokens, { fungibleTokensService } from '../FungibleTokens';
import refFinanceContract from './RefFinanceContract';
import { isNearTransformation, replaceNearIfNecessary } from './utils';

class FungibleTokenExchange {
    _exchange;

    constructor(exchangeInstance) {
        this._exchange = exchangeInstance;
    }

    async getData({ account }) {
        return this._exchange.getData({ account });
    }

    async estimate(params) {
        if (isNearTransformation(params)) {
            return this._estimateNearSwap(params);
        }

        return this._estimateSwap(params);
    }

    async swap(params) {
        if (isNearTransformation(params)) {
            return this._transformNear(params);
        }

        const { tokenIn, tokenOut } = params;

        if (tokenIn.contractName === NEAR_ID) {
            return this._swapNearToToken(params);
        }

        if (tokenIn.contractName === NEAR_TOKEN_ID) {
            return this._swapWNearToToken(params);
        }

        if (tokenOut.contractName === NEAR_ID) {
            return this._swapTokenToNear(params);
        }

        if (tokenOut.contractName === NEAR_TOKEN_ID) {
            return this._swapTokenToWNear(params);
        }

        return this._swapTokenToToken(params);
    }

    _estimateNearSwap(params) {
        return {
            amountOut: params.amountIn,
        };
    }

    async _estimateSwap(params) {
        const { tokenIn, tokenOut } = params;

        return this._exchange.estimate({
            ...params,
            tokenIn: replaceNearIfNecessary(tokenIn),
            tokenOut: replaceNearIfNecessary(tokenOut),
        });
    }

    _transformNear(params) {
        const { account, tokenIn, amountIn } = params;

        return fungibleTokensService.transformNear({
            accountId: account.accountId,
            amount: amountIn,
            toWNear: tokenIn.contractName !== NEAR_TOKEN_ID,
        });
    }

    async _swapNearToToken(params) {
        const { account, tokenIn, tokenOut, amountIn } = params;
        const transactions = [];
        const depositTransactions = await this._getDepositTransactions(
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
        const swapActions = await this._exchange.getSwapActions({
            ...params,
            tokenIn: replaceNearIfNecessary(tokenIn),
        });

        transactions.push(wrapNear, {
            receiverId: NEAR_TOKEN_ID,
            actions: swapActions,
        });

        return this._processTransactions(account, transactions);
    }

    async _swapWNearToToken(params) {
        const { account, tokenOut } = params;
        const transactions = [];
        const depositTransactions = await this._getDepositTransactions(
            account.accountId,
            [tokenOut.contractName]
        );

        if (depositTransactions) {
            transactions.push(...depositTransactions);
        }

        const swapActions = await this._exchange.getSwapActions(params);

        transactions.push({
            receiverId: NEAR_TOKEN_ID,
            actions: swapActions,
        });

        return this._processTransactions(account, transactions);
    }

    // @todo add NEAR in the token list and check this flow
    async _swapTokenToNear(params) {
        const { account, tokenIn, tokenOut, amountIn } = params;
        const transactions = [];
        const depositTransactions = await this._getDepositTransactions(
            account.accountId,
            [tokenOut.contractName]
        );

        if (depositTransactions) {
            transactions.push(...depositTransactions);
        }

        const swapActions = await this._exchange.getSwapActions({
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

        return this._processTransactions(account, transactions);
    }

    async _swapTokenToWNear(params) {
        const { account, tokenIn, tokenOut } = params;
        const transactions = [];
        const depositTransactions = await this._getDepositTransactions(
            account.accountId,
            [tokenOut.contractName]
        );

        if (depositTransactions) {
            transactions.push(...depositTransactions);
        }

        const swapActions = await this._exchange.getSwapActions(params);

        transactions.push({
            receiverId: tokenIn.contractName,
            actions: swapActions,
        });

        return this._processTransactions(account, transactions);
    }

    async _swapTokenToToken(params) {
        const { account, tokenIn, tokenOut } = params;
        const transactions = [];
        const depositTransactions = await this._getDepositTransactions(
            account.accountId,
            [tokenIn.contractName, tokenOut.contractName]
        );

        if (depositTransactions) {
            transactions.push(...depositTransactions);
        }

        const swapActions = await this._exchange.getSwapActions(params);

        transactions.push({
            receiverId: tokenIn.contractName,
            actions: swapActions,
        });

        return this._processTransactions(account, transactions);
    }

    async _getDepositTransactions(accountId, contracts) {
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

    async _processTransactions(account, txs) {
        const swapResult = {};

        for (const tx of txs) {
            const {
                transaction: { hash, actions },
            } = await account.signAndSendTransaction(tx);

            const swapTx = actions.find((action) => {
                if (action['FunctionCall']?.method_name === 'ft_transfer_call') {
                    return true;
                }
            });

            if (swapTx) {
                swapResult.swapTxHash = hash;
            }
        }

        return swapResult;
    }
}

export default new FungibleTokenExchange(refFinanceContract);
