import Big from 'big.js';
import { transactions, utils } from 'near-api-js';
import { stringifyUrl } from 'query-string';

import CONFIG from '../../config';
import FiatValueManager from '../../utils/fiatValueManager';
import {
    createQuoteContext,
    fromRaw,
    getTransactionFee,
    getUsdPriceImpact,
    type QuoteRequest,
    type SwapQuote,
    type SwapTransaction,
} from './quotes';

const ROUTER_URL = 'https://smartx.rhea.finance/swapMultiDexPath';
const AGGREGATOR_ID = 'aggregatedex.near';
const ROUTER_TIMEOUT_MS = 5_000;
const STORAGE_GAS = '50000000000000';
const INTERNAL_STORAGE_GAS = '30000000000000';
const SWAP_GAS = '300000000000000';
const WITHDRAW_GAS = '300000000000000';
const INTERNAL_STORAGE_NEAR = '0.005';
const ONE_YOCTO = '1';
const ACCOUNT_ID = /^(?=.{2,64}$)[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const RAW_AMOUNT = /^(0|[1-9]\d*)$/;
const fiatValueManager = new FiatValueManager();

interface RouterResponse {
    result_code: number;
    result_message?: string;
    result_data?: {
        amount_in: string;
        amount_out: string;
        min_amount_out: string;
        msg: string;
        signature: string;
        tokens: string[];
    };
}

export interface SmartRouterBalance {
    tokenId: string;
    amount: string;
    metadata: Record<string, unknown> | null;
}

export interface SmartRouterResult {
    success: boolean;
    unconfirmed?: boolean;
    amountOutRaw?: string;
    failReason?: string;
}

function assertRawAmount(value: unknown, positive = true): asserts value is string {
    if (
        typeof value !== 'string' ||
        value.length > 78 ||
        !RAW_AMOUNT.test(value) ||
        (positive && !Big(value).gt(0))
    ) {
        throw new Error('Invalid SmartRouter V2 amount');
    }
}

function assertAccountId(value: unknown): asserts value is string {
    if (typeof value !== 'string' || !ACCOUNT_ID.test(value)) {
        throw new Error('Invalid SmartRouter V2 token or account ID');
    }
}

function call(
    receiverId: string,
    method: string,
    args: object,
    gas: string,
    deposit: string
): SwapTransaction {
    return {
        receiverId,
        actions: [transactions.functionCall(method, args, gas, deposit)],
    };
}

function throwIfCancelled(signal?: AbortSignal): void {
    if (signal?.aborted) {
        throw new DOMException('Swap quote cancelled', 'AbortError');
    }
}

function parseEvents(result: any): { event: string; data: any[] }[] {
    const events = [];
    for (const transaction of result?.data || []) {
        for (const receipt of transaction?.receipts_outcome || []) {
            if (receipt?.outcome?.executor_id !== AGGREGATOR_ID) {
                continue;
            }
            for (const log of receipt?.outcome?.logs || []) {
                if (typeof log !== 'string' || !log.startsWith('EVENT_JSON:')) {
                    continue;
                }
                try {
                    const event = JSON.parse(log.slice('EVENT_JSON:'.length));
                    if (typeof event?.event === 'string' && Array.isArray(event.data)) {
                        events.push(event);
                    }
                } catch {
                    // Malformed third-party logs do not prove a completed swap.
                }
            }
        }
    }
    return events;
}

export class SmartRouterV2 {
    private async storageDeposit(
        account: Wallet.Account,
        tokenId: string,
        subject: string,
        signal?: AbortSignal
    ): Promise<SwapTransaction | null> {
        throwIfCancelled(signal);
        const balance = await account.viewFunction(tokenId, 'storage_balance_of', {
            account_id: subject,
        });
        throwIfCancelled(signal);
        if (balance) {
            return null;
        }
        const bounds = (await account.viewFunction(
            tokenId,
            'storage_balance_bounds',
            {}
        )) as unknown as { min: string };
        throwIfCancelled(signal);
        assertRawAmount(bounds?.min);
        return call(
            tokenId,
            'storage_deposit',
            {
                account_id: subject,
                registration_only: true,
            },
            STORAGE_GAS,
            bounds.min
        );
    }

    async getQuote(request: QuoteRequest): Promise<SwapQuote> {
        const { account, tokenIn, tokenOut, signal } = request;
        throwIfCancelled(signal);
        const context = createQuoteContext(request);
        const accountId = context.accountId;
        const tokenInId =
            tokenIn.contractName === CONFIG.NEAR_ID
                ? CONFIG.NEAR_TOKEN_ID
                : tokenIn.contractName;
        const tokenOutId =
            tokenOut.contractName === CONFIG.NEAR_ID
                ? CONFIG.NEAR_TOKEN_ID
                : tokenOut.contractName;
        assertAccountId(tokenInId);
        assertAccountId(tokenOutId);
        if (tokenInId === tokenOutId) {
            throw new Error('Choose different swap tokens');
        }

        const slippage = Big(context.slippage).div(100);
        if (slippage.lt(0) || slippage.gte(1)) {
            throw new Error('Invalid swap slippage');
        }
        const params = {
            amountIn: context.amountIn,
            tokenIn: tokenInId,
            tokenOut: tokenOutId,
            slippage: slippage.toFixed(),
            chainId: '0',
            pathDeep: '3',
            user: accountId,
            receiveUser: accountId,
            skipUnwrapNativeToken: String(tokenOut.contractName === CONFIG.NEAR_TOKEN_ID),
        };
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), ROUTER_TIMEOUT_MS);
        const abort = () => controller.abort();
        signal?.addEventListener('abort', abort, { once: true });
        if (signal?.aborted) {
            controller.abort();
        }
        let response: RouterResponse;
        try {
            const http = await fetch(stringifyUrl({ url: ROUTER_URL, query: params }), {
                signal: controller.signal,
            });
            if (!http.ok) {
                throw new Error('SmartRouter V2 is unavailable');
            }
            response = await http.json();
        } finally {
            clearTimeout(timeout);
            signal?.removeEventListener('abort', abort);
        }
        throwIfCancelled(signal);
        const data = response?.result_data;
        if (response?.result_code !== 0) {
            throw Object.assign(
                new Error(response?.result_message || 'No SmartRouter V2 quote available'),
                { code: 'NO_ROUTE' }
            );
        }
        if (!data) {
            throw new Error('Invalid SmartRouter V2 quote');
        }
        assertRawAmount(data.amount_in);
        assertRawAmount(data.amount_out);
        assertRawAmount(data.min_amount_out);
        const requestedMinimum = Big(data.amount_out)
            .times(Big(1).minus(slippage))
            .round(0, Big.roundDown);
        if (
            data.amount_in !== context.amountIn ||
            Big(data.min_amount_out).gt(data.amount_out) ||
            Big(data.min_amount_out).lt(requestedMinimum) ||
            typeof data.msg !== 'string' ||
            !data.msg ||
            typeof data.signature !== 'string' ||
            !data.signature ||
            !Array.isArray(data.tokens) ||
            data.tokens.length === 0 ||
            data.tokens.length > 32
        ) {
            throw new Error('Invalid SmartRouter V2 quote');
        }
        data.tokens.forEach(assertAccountId);
        const routeTokenIds = [...new Set(data.tokens)].sort();
        if (!routeTokenIds.includes(tokenInId) || !routeTokenIds.includes(tokenOutId)) {
            throw new Error('Invalid SmartRouter V2 route');
        }

        throwIfCancelled(signal);
        const storageRequests = routeTokenIds.flatMap((tokenId) => [
            { tokenId, subject: accountId },
            { tokenId, subject: AGGREGATOR_ID },
        ]);
        const [registered, prices, storageTransactions] = await Promise.all([
            account.viewFunction(AGGREGATOR_ID, 'query_user_tokens_registered', {
                user: accountId,
                tokens: routeTokenIds,
            }),
            fiatValueManager.fetchRefFinancePrices(),
            Promise.all(
                storageRequests.map(async ({ tokenId, subject }) =>
                    this.storageDeposit(account, tokenId, subject, signal)
                )
            ),
        ]);
        throwIfCancelled(signal);
        const transactionsToSign: SwapTransaction[] = [];
        const registrations: string[] = [];
        storageTransactions.forEach((tx, index) => {
            if (tx) {
                const { tokenId, subject } = storageRequests[index];
                registrations.push(`ft:${subject}:${tokenId}`);
                transactionsToSign.push(tx);
            }
        });
        if (
            !Array.isArray(registered) ||
            registered.length !== routeTokenIds.length ||
            registered.some((value) => typeof value !== 'boolean')
        ) {
            throw new Error('Invalid SmartRouter V2 registration response');
        }
        const missing = routeTokenIds.filter((_, index) => !registered[index]);
        if (missing.length) {
            registrations.push(
                ...missing.map((tokenId) => `internal:${accountId}:${tokenId}`)
            );
            transactionsToSign.push(
                call(
                    AGGREGATOR_ID,
                    'tokens_storage_deposit',
                    {
                        user: accountId,
                        tokens: missing,
                    },
                    INTERNAL_STORAGE_GAS,
                    utils.format.parseNearAmount(
                        Big(INTERNAL_STORAGE_NEAR).times(missing.length).toFixed()
                    )
                )
            );
        }
        if (tokenIn.contractName === CONFIG.NEAR_ID) {
            transactionsToSign.push(
                call(
                    CONFIG.NEAR_TOKEN_ID,
                    'near_deposit',
                    {},
                    STORAGE_GAS,
                    context.amountIn
                )
            );
        }
        transactionsToSign.push(
            call(
                tokenInId,
                'ft_transfer_call',
                {
                    receiver_id: AGGREGATOR_ID,
                    amount: context.amountIn,
                    msg: JSON.stringify({ msg: data.msg, signature: data.signature }),
                },
                SWAP_GAS,
                ONE_YOCTO
            )
        );

        const amountOut = fromRaw(data.amount_out, tokenOut.onChainFTMetadata.decimals);
        const minAmountOut = fromRaw(
            data.min_amount_out,
            tokenOut.onChainFTMetadata.decimals
        );
        const priceIn =
            prices[
                tokenIn.contractName === CONFIG.NEAR_ID ? 'near' : tokenIn.contractName
            ]?.usd;
        const priceOut =
            prices[
                tokenOut.contractName === CONFIG.NEAR_ID ? 'near' : tokenOut.contractName
            ]?.usd;
        const priceImpactPercent = getUsdPriceImpact({
            amountIn: fromRaw(context.amountIn, tokenIn.onChainFTMetadata.decimals),
            amountOut,
            priceIn,
            priceOut,
        });
        const cost = await getTransactionFee(account, transactionsToSign, {
            nativePrincipalRaw:
                tokenIn.contractName === CONFIG.NEAR_ID ? context.amountIn : '0',
        });
        throwIfCancelled(signal);
        return {
            source: 'v2',
            context,
            quotedAt: Date.now(),
            amountOutRaw: data.amount_out,
            minAmountOutRaw: data.min_amount_out,
            amountOut,
            minAmountOut,
            outputDecimals: tokenOut.onChainFTMetadata.decimals,
            priceImpactPercent,
            ...cost,
            swapFee: null,
            transactions: transactionsToSign,
            registrationKey: registrations.sort().join('|'),
            routeTokenIds,
            execution: { msg: data.msg, signature: data.signature },
        };
    }

    async getBalances(account: Wallet.Account): Promise<SmartRouterBalance[]> {
        const balances: SmartRouterBalance[] = [];
        const pageSize = 100;
        for (let offset = 0; ; offset += pageSize) {
            const page = await account.viewFunction(
                AGGREGATOR_ID,
                'query_user_exist_balance',
                {
                    user: account.accountId,
                    from_index: offset,
                    count: pageSize,
                }
            );
            if (
                !Array.isArray(page) ||
                !Array.isArray(page[0]) ||
                !Array.isArray(page[1]) ||
                page[0].length !== page[1].length ||
                page[0].length > pageSize
            ) {
                throw new Error('Invalid SmartRouter V2 balances');
            }
            for (let i = 0; i < page[0].length; i++) {
                const tokenId = page[0][i];
                const amount = page[1][i];
                assertAccountId(tokenId);
                assertRawAmount(amount, false);
                if (Big(amount).gt(0)) {
                    const metadata = await account.viewFunction(
                        tokenId,
                        'ft_metadata',
                        {}
                    ).catch(() => null);
                    balances.push({ tokenId, amount, metadata });
                }
            }
            if (page[0].length < pageSize) {
                return balances;
            }
        }
    }

    async getWithdrawalTransactions({
        account,
        tokenId,
    }: {
        account: Wallet.Account;
        tokenId: string;
    }): Promise<SwapTransaction[]> {
        assertAccountId(tokenId);
        assertAccountId(account?.accountId);
        const storage = await this.storageDeposit(account, tokenId, account.accountId);
        return [
            ...(storage ? [storage] : []),
            call(
                AGGREGATOR_ID,
                'withdraw',
                { token: tokenId, return_near: false },
                WITHDRAW_GAS,
                ONE_YOCTO
            ),
        ];
    }

    interpretResult({
        result,
        quote,
    }: {
        result: any;
        quote: SwapQuote;
    }): SmartRouterResult {
        if (result?.success === false) {
            return {
                success: false,
                failReason:
                    typeof result.failReason === 'string' && result.failReason
                        ? result.failReason
                        : 'SmartRouter V2 transaction failed',
            };
        }
        if (!Array.isArray(result?.data) || result.data.length === 0) {
            return { success: false, unconfirmed: true };
        }
        for (const transaction of result.data) {
            if (
                transaction?.status?.Failure ||
                transaction?.receipts_outcome?.some(
                    (receipt: any) => receipt?.outcome?.status?.Failure
                )
            ) {
                return {
                    success: false,
                    failReason: 'SmartRouter V2 transaction failed',
                };
            }
        }
        const events = parseEvents(result);
        if (
            events.some(
                ({ event }) =>
                    event === 'single_swap_failed' ||
                    event === 'swap_failed_refund_started' ||
                    event === 'withdraw_failed'
            )
        ) {
            return {
                success: false,
                failReason: 'SmartRouter V2 swap failed or refunded',
            };
        }
        const outputId =
            quote.context.tokenOutId === CONFIG.NEAR_ID
                ? CONFIG.NEAR_TOKEN_ID
                : quote.context.tokenOutId;
        // Native NEAR swaps emit no withdraw_succeeded event after unwrapping.
        const nativeSwapSucceeded =
            quote.context.tokenOutId === CONFIG.NEAR_ID &&
            result.data.every((tx: any) =>
                Object.prototype.hasOwnProperty.call(tx?.status || {}, 'SuccessValue')
            ) &&
            events.some(({ event }) => event === 'single_swap_success');
        const receipt = events
            .filter(
                ({ event }) =>
                    event === 'withdraw_succeeded' ||
                    (nativeSwapSucceeded && event === 'withdraw_started')
            )
            .flatMap(({ data }) => data)
            .find(
                ({ token_id, receive_id, user_id, amount }) =>
                    token_id === outputId &&
                    (receive_id || user_id) === quote.context.accountId &&
                    typeof amount === 'string' &&
                    RAW_AMOUNT.test(amount) &&
                    Big(amount).gte(quote.minAmountOutRaw)
            );
        return receipt
            ? { success: true, amountOutRaw: receipt.amount }
            : { success: false, unconfirmed: true };
    }
}

export default new SmartRouterV2();
