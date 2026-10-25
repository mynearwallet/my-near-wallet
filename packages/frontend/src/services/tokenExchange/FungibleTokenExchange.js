import Big from 'big.js';
import { transactions } from 'near-api-js';

import refFinanceContract from './RefFinanceContract';
import smartRouterV2 from './SmartRouterV2';
import {
    createQuoteContext,
    fromRaw,
    QUOTE_REFRESH_INTERVAL_MS,
    requiresQuoteReview,
    sameQuoteContext,
} from './quotes';
import CONFIG from '../../config';
import { fungibleTokensService } from '../FungibleTokens';
import { dispatchTransactionsExecutor } from '../../redux/slices/sign/transactionExecutor';

export class FungibleTokenExchange {
    constructor({ exchaingeContract, tokenService, router = smartRouterV2 }) {
        this._exchangeContract = exchaingeContract;
        this._tokenService = tokenService;
        this._router = router;
    }

    async getData({ account }) {
        return this._exchangeContract.getData({ account });
    }

    async estimate(params) {
        if (this.isNearTransformation(params)) {
            return this._estimateNearSwap(params);
        }

        if (CONFIG.CURRENT_NEAR_NETWORK !== 'mainnet') {
            return this._estimateSwap(params);
        }
        const [ref, v2] = await Promise.allSettled([
            this._estimateSwap(params),
            this._router.getQuote(params),
        ]);
        if (params.signal?.aborted) {
            throw new Error('Quote request cancelled');
        }
        if (v2.status === 'fulfilled' &&
            (ref.status === 'rejected' || Big(v2.value.amountOut).gt(ref.value.amountOut))) {
            return this._v2Estimate(v2.value);
        }
        if (ref.status === 'fulfilled') {
            return ref.value;
        }
        throw v2.reason;
    }

    async swap(params) {
        if (params.v2Quote) {
            return this._swapV2(params);
        }
        if (this.isNearTransformation(params)) {
            return this._transformNear(params);
        }

        const { account, poolId, tokenIn, tokenOut, amountIn, minAmountOut } = params;
        const {
            contractName: tokenInId,
            onChainFTMetadata: { decimals: tokenInDecimals },
        } = tokenIn;
        const {
            contractName: tokenOutId,
            onChainFTMetadata: { decimals: tokenOutDecimals },
        } = tokenOut;

        const swapParams = {
            account,
            poolId,
            tokenInId,
            tokenInDecimals,
            amountIn,
            tokenOutId,
            tokenOutDecimals,
            minAmountOut,
        };

        if (tokenInId === CONFIG.NEAR_ID) {
            return this._swapNearToToken(swapParams);
        }

        if (tokenInId === CONFIG.NEAR_TOKEN_ID) {
            return this._swapWNearToToken(swapParams);
        }

        if (tokenOutId === CONFIG.NEAR_ID) {
            return this._swapTokenToNear(swapParams);
        }

        if (tokenOutId === CONFIG.NEAR_TOKEN_ID) {
            return this._swapTokenToWNear(swapParams);
        }

        return this._swapTokenToToken(swapParams);
    }

    _v2Estimate(quote) {
        return {
            amountOut: quote.amountOut,
            minAmountOut: quote.minAmountOut,
            priceImpactPercent: quote.priceImpactPercent,
            estimatedFee: quote.estimatedFee,
            requiredNearBalance: quote.requiredNearBalance,
            routeTokenIds: quote.routeTokenIds,
            v2Quote: quote,
        };
    }

    async _swapV2({ account, tokenIn, tokenOut, amountIn, slippage, v2Quote, isCurrent = () => true }) {
        if (CONFIG.CURRENT_NEAR_NETWORK !== 'mainnet') {
            throw new Error('SmartRouter V2 is unavailable on this network.');
        }
        const context = createQuoteContext({ account, tokenIn, tokenOut, amountIn, slippage });
        const current = () => isCurrent() && sameQuoteContext(context, v2Quote.context);
        if (!current()) {
            throw new Error('Swap account or input changed. Please review again.');
        }
        const quote = Date.now() - v2Quote.quotedAt < QUOTE_REFRESH_INTERVAL_MS
            ? v2Quote
            : await this._router.getQuote({ account, tokenIn, tokenOut, amountIn, slippage });
        if (!current()) {
            throw new Error('Swap account or input changed. Please review again.');
        }
        if (requiresQuoteReview(v2Quote, quote)) {
            return { reviewRequired: true, quote: this._v2Estimate(quote) };
        }
        if (Big(quote.priceImpactPercent).gt(6)) {
            throw new Error('Price impact is too high. Please review again.');
        }
        const result = await dispatchTransactionsExecutor(quote.transactions, account.accountId, {
            shouldContinue: current,
            captureUnknown: true,
        });
        if (result.retry) {
            return { retry: true };
        }
        return this._formatV2Result(result, quote);
    }

    _formatV2Result(result, quote) {
        if (result.unconfirmed && Number.isInteger(result.transactionIndex)) {
            quote = {
                ...quote,
                execution: { ...quote.execution, pendingTransactionIndex: result.transactionIndex },
            };
        }
        const outcome = result.unconfirmed
            ? { success: false, unconfirmed: true, failReason: result.failReason }
            : this._router.interpretResult({ result, quote });
        return {
            ...outcome,
            quote,
            swapTxHash: result.txHash,
            routeTokenIds: quote.routeTokenIds,
            amountOut: outcome.amountOutRaw && Number.isInteger(quote.outputDecimals)
                ? fromRaw(outcome.amountOutRaw, quote.outputDecimals)
                : undefined,
        };
    }

    async checkSwapResult({ account, quote, hash }) {
        if (!quote || account.accountId !== quote.context.accountId || !hash) {
            throw new Error('This transaction belongs to a different swap account.');
        }
        const outcome = await account.connection.provider.txStatus(hash, account.accountId);
        const success =
            Object.prototype.hasOwnProperty.call(outcome.status || {}, 'SuccessValue') &&
            Array.isArray(outcome.receipts_outcome) &&
            !outcome.receipts_outcome.some((receipt) => receipt.outcome.status?.Failure);
        if (!success && !outcome.status?.Failure &&
            !outcome.receipts_outcome?.some((receipt) => receipt.outcome.status?.Failure)) {
            return { success: false, unconfirmed: true, swapTxHash: hash,
                failReason: 'Transaction is not confirmed yet. Check its status again.' };
        }
        if (Number.isInteger(quote.execution?.pendingTransactionIndex) &&
            quote.execution.pendingTransactionIndex < quote.transactions.length - 1) {
            return { success: false, unconfirmed: false, swapTxHash: hash,
                failReason: success
                    ? 'Preparation completed. The swap was not submitted. Review a new quote to continue.'
                    : 'A swap transaction failed. Check your activity and token balances before trying again.' };
        }
        if (quote.execution?.withdrawal &&
            !outcome.transaction?.actions?.some((action) => action.FunctionCall?.method_name === 'withdraw')) {
            return { success: false, unconfirmed: false, swapTxHash: hash,
                failReason: 'Withdrawal preparation finished. No withdrawal was submitted. Refresh the balance to continue.' };
        }
        return this._formatV2Result({ success, data: [outcome], txHash: hash }, quote);
    }

    async checkWithdrawalResult({ account, tokenId, hash }) {
        return this.checkSwapResult({
            account,
            hash,
            quote: {
                source: 'v2',
                context: { accountId: account.accountId, tokenOutId: tokenId },
                minAmountOutRaw: '0',
                execution: { withdrawal: true },
            },
        });
    }

    async getRecoverableBalances(account) {
        return CONFIG.CURRENT_NEAR_NETWORK === 'mainnet'
            ? this._router.getBalances(account)
            : [];
    }

    async withdraw({ account, tokenId, isCurrent = () => true }) {
        if (CONFIG.CURRENT_NEAR_NETWORK !== 'mainnet' || !isCurrent()) {
            throw new Error('Withdrawal account changed. Please try again.');
        }
        const balances = await this._router.getBalances(account);
        if (!balances.some((item) => item.tokenId === tokenId)) {
            throw new Error('No balance available to withdraw');
        }
        const txs = await this._router.getWithdrawalTransactions({ account, tokenId });
        const current = () => isCurrent();
        if (!current()) {
            throw new Error('Withdrawal account changed. Please try again.');
        }
        const result = await dispatchTransactionsExecutor(txs, account.accountId, {
            shouldContinue: current,
            captureUnknown: true,
        });
        if (result.retry) {
            return { retry: true };
        }
        const quote = { context: { accountId: account.accountId, tokenOutId: tokenId },
            minAmountOutRaw: '0', execution: { withdrawal: true }, transactions: txs };
        const formatted = this._formatV2Result(result, quote);
        return { ...formatted, quote: undefined };
    }

    isNearTransformation(params) {
        const { tokenIn, tokenOut } = params;
        const ids = [tokenIn.contractName, tokenOut.contractName];

        return ids.includes(CONFIG.NEAR_TOKEN_ID) && ids.includes(CONFIG.NEAR_ID);
    }

    replaceNearIdIfNecessary(id) {
        return id === CONFIG.NEAR_ID ? CONFIG.NEAR_TOKEN_ID : id;
    }

    _estimateNearSwap(params) {
        return {
            amountOut: params.amountIn,
        };
    }

    async _estimateSwap(params) {
        const { tokenIn, tokenOut } = params;

        return this._exchangeContract.estimate({
            ...params,
            tokenInId: this.replaceNearIdIfNecessary(tokenIn.contractName),
            tokenInDecimals: tokenIn.onChainFTMetadata.decimals,
            tokenOutId: this.replaceNearIdIfNecessary(tokenOut.contractName),
            tokenOutDecimals: tokenOut.onChainFTMetadata.decimals,
        });
    }

    async _transformNear(params) {
        const { account, tokenIn, amountIn } = params;

        const {
            transaction: { hash },
        } = await this._tokenService.transformNear({
            accountId: account.accountId,
            amount: amountIn,
            toWNear: tokenIn.contractName !== CONFIG.NEAR_TOKEN_ID,
        });

        return {
            success: true,
            swapTxHash: hash,
        };
    }

    async _swapNearToToken(params) {
        const { account, tokenOutId, amountIn } = params;
        const transactions = [];
        const depositTransactions = await this._getDepositTransactions(account, [
            tokenOutId,
        ]);

        if (depositTransactions) {
            transactions.push(...depositTransactions);
        }

        const wrapNear = await this._tokenService.getWrapNearTx({
            accountId: account.accountId,
            amount: amountIn,
        });
        const swapActions = await this._exchangeContract.getSwapActions({
            ...params,
            tokenInId: CONFIG.NEAR_TOKEN_ID,
        });

        transactions.push(wrapNear, {
            receiverId: CONFIG.NEAR_TOKEN_ID,
            actions: swapActions,
        });

        return this._processTransactions(account, transactions);
    }

    async _swapWNearToToken(params) {
        const { account, tokenOutId } = params;
        const transactions = [];
        const depositTransactions = await this._getDepositTransactions(account, [
            tokenOutId,
        ]);

        if (depositTransactions) {
            transactions.push(...depositTransactions);
        }

        const swapActions = await this._exchangeContract.getSwapActions(params);

        transactions.push({
            receiverId: CONFIG.NEAR_TOKEN_ID,
            actions: swapActions,
        });

        return this._processTransactions(account, transactions);
    }

    async _swapTokenToNear(params) {
        const { account, tokenInId, minAmountOut } = params;
        const transactions = [];
        const depositTransactions = await this._getDepositTransactions(account, [
            tokenInId,
            CONFIG.NEAR_TOKEN_ID,
        ]);

        if (depositTransactions) {
            transactions.push(...depositTransactions);
        }

        const swapActions = await this._exchangeContract.getSwapActions({
            ...params,
            tokenOutId: CONFIG.NEAR_TOKEN_ID,
        });
        const unwrapNear = await this._tokenService.getUnwrapNearTx({
            accountId: account.accountId,
            amount: minAmountOut,
        });

        transactions.push(
            {
                receiverId: tokenInId,
                actions: swapActions,
            },
            unwrapNear
        );

        return this._processTransactions(account, transactions);
    }

    async _swapTokenToWNear(params) {
        const { account, tokenInId, tokenOutId } = params;
        const transactions = [];
        const depositTransactions = await this._getDepositTransactions(account, [
            tokenInId,
            tokenOutId,
        ]);

        if (depositTransactions) {
            transactions.push(...depositTransactions);
        }

        const swapActions = await this._exchangeContract.getSwapActions(params);

        transactions.push({
            receiverId: tokenInId,
            actions: swapActions,
        });

        return this._processTransactions(account, transactions);
    }

    async _swapTokenToToken(params) {
        const { account, tokenInId, tokenOutId } = params;
        const transactions = [];
        const depositTransactions = await this._getDepositTransactions(account, [
            tokenInId,
            tokenOutId,
        ]);

        if (depositTransactions) {
            transactions.push(...depositTransactions);
        }

        const swapActions = await this._exchangeContract.getSwapActions(params);

        transactions.push({
            receiverId: tokenInId,
            actions: swapActions,
        });

        return this._processTransactions(account, transactions);
    }

    async _getDepositTransactions(account, tokenIds) {
        const txs = [];
        const { accountId } = account;

        for (const id of tokenIds) {
            const tokenStorage = await account.viewFunction(id, 'storage_balance_of', {
                account_id: accountId,
            });

            if (!tokenStorage) {
                txs.push({
                    receiverId: id,
                    actions: [
                        transactions.functionCall(
                            'storage_deposit',
                            {
                                account_id: accountId,
                                signer_id: accountId,
                                receiver_id: id,
                                registration_only: true,
                            },
                            CONFIG.FT_STORAGE_DEPOSIT_GAS,
                            CONFIG.FT_MINIMUM_STORAGE_BALANCE_LARGE
                        ),
                    ],
                });
            }
        }

        return txs.length ? txs : null;
    }

    async _processTransactions(account, txs) {
        const res = await dispatchTransactionsExecutor(txs, account.accountId);
        return {
            success: res.success,
            swapTxHash: res.txHash,
            failReason: res.failReason,
            retry: res.retry,
        };
    }
}

export default new FungibleTokenExchange({
    exchaingeContract: refFinanceContract,
    tokenService: fungibleTokensService,
});
