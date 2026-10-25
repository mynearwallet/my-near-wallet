import Big from 'big.js';
import { transactions } from 'near-api-js';

import { wallet } from '../../utils/wallet';

const Decimal = Big();
Decimal.DP = 100;

export const QUOTE_REFRESH_INTERVAL_MS = 10_000;

export interface QuoteContext {
    accountId: string;
    tokenInId: string;
    tokenOutId: string;
    amountIn: string;
    slippage: string;
}

export interface SwapTransaction {
    receiverId: string;
    actions: transactions.Action[];
}

export interface QuoteRequest {
    account: Wallet.Account;
    tokenIn: Wallet.Token;
    tokenOut: Wallet.Token;
    amountIn: string;
    slippage: number;
    signal?: AbortSignal;
}

export interface SwapQuote {
    source: 'v2';
    context: QuoteContext;
    quotedAt?: number;
    amountOutRaw: string;
    minAmountOutRaw: string;
    amountOut: string;
    minAmountOut: string;
    outputDecimals: number;
    priceImpactPercent: string;
    swapFee: string | null;
    estimatedFee: string;
    requiredNearBalance: string;
    transactions: SwapTransaction[];
    registrationKey: string;
    routeTokenIds: string[];
    execution: {
        msg?: string;
        signature?: string;
        pendingTransactionIndex?: number;
        withdrawal?: boolean;
    };
}

export function toRaw(amount: string, decimals: number): string {
    if (
        !/^\d+(\.\d+)?$/.test(String(amount)) ||
        !Number.isInteger(decimals) ||
        decimals < 0
    ) {
        throw new Error('Invalid swap amount');
    }
    const raw = Big(amount).times(Big(10).pow(decimals));
    if (!raw.gt(0) || !raw.eq(raw.round(0, Big.roundDown))) {
        throw new Error('Invalid swap amount precision');
    }
    return raw.toFixed(0);
}

export function fromRaw(amount: string, decimals: number): string {
    if (!/^\d+$/.test(amount) || !Number.isInteger(decimals) || decimals < 0) {
        throw new Error('Invalid token amount');
    }
    const digits = Big(amount)
        .toFixed(0)
        .padStart(decimals + 1, '0');
    if (decimals === 0) {
        return digits;
    }
    const fraction = digits.slice(-decimals).replace(/0+$/, '');
    return digits.slice(0, -decimals) + (fraction ? `.${fraction}` : '');
}

export function createQuoteContext(params: QuoteRequest): QuoteContext {
    const { account, tokenIn, tokenOut, amountIn, slippage } = params;
    if (
        !account?.accountId ||
        !tokenIn ||
        !tokenOut ||
        !Number.isFinite(slippage) ||
        slippage < 0 ||
        slippage >= 100
    ) {
        throw new Error('Invalid swap request');
    }
    if (tokenIn.contractName === tokenOut.contractName) {
        throw new Error('Choose different swap tokens');
    }
    return {
        accountId: account.accountId,
        tokenInId: tokenIn.contractName,
        tokenOutId: tokenOut.contractName,
        amountIn: toRaw(amountIn, tokenIn.onChainFTMetadata.decimals),
        slippage: Big(slippage).toFixed(),
    };
}

export function sameQuoteContext(left: QuoteContext, right: QuoteContext): boolean {
    return (
        !!left &&
        !!right &&
        (['accountId', 'tokenInId', 'tokenOutId', 'amountIn', 'slippage'] as const).every(
            (key) => left[key] === right[key]
        )
    );
}

export function requiresQuoteReview(previous: SwapQuote, fresh: SwapQuote): boolean {
    return (
        !sameQuoteContext(previous.context, fresh.context) ||
        Big(fresh.minAmountOutRaw).lt(previous.minAmountOutRaw) ||
        Big(fresh.estimatedFee).gt(previous.estimatedFee) ||
        Big(fresh.requiredNearBalance).gt(previous.requiredNearBalance) ||
        fresh.registrationKey !== previous.registrationKey ||
        Big(fresh.priceImpactPercent).gt(6)
    );
}

export function getUsdPriceImpact({
    amountIn,
    amountOut,
    priceIn,
    priceOut,
}: {
    amountIn: string;
    amountOut: string;
    priceIn: string | number;
    priceOut: string | number;
}): string {
    if (
        !priceIn ||
        !priceOut ||
        !Big(priceIn).gt(0) ||
        !Big(priceOut).gt(0) ||
        !Big(amountIn).gt(0)
    ) {
        throw new Error('Token prices unavailable for SmartRouter V2');
    }
    const impact = Decimal(1)
        .minus(Decimal(amountOut).times(priceOut).div(Decimal(amountIn).times(priceIn)))
        .times(100);
    return impact.gt(0) ? impact.toFixed() : '0';
}

export async function getTransactionFee(
    account: Wallet.Account,
    txs: SwapTransaction[],
    { nativePrincipalRaw = '0' }: { nativePrincipalRaw?: string } = {}
): Promise<Pick<SwapQuote, 'estimatedFee' | 'requiredNearBalance'>> {
    const provider = wallet.connection.provider;
    const block = await provider.block({ finality: 'final' });
    const { runtime_config } = await provider.experimental_protocolConfig({
        finality: 'final',
    });
    type Fee = { send_sir: number; send_not_sir: number; execution: number };
    const config = runtime_config as typeof runtime_config & {
        min_gas_purchase_price?: string;
        transaction_costs: {
            action_receipt_creation_config: Fee;
            action_creation_config: {
                function_call_cost: Fee;
                function_call_cost_per_byte: Fee;
            };
        };
    };
    const currentPrice = Big(block.header.gas_price);
    // The runtime buys receipt gas at this floor and refunds unused gas later.
    const minimumPrice = Big(config.min_gas_purchase_price || '0');
    const purchasePrice = currentPrice.gt(minimumPrice) ? currentPrice : minimumPrice;
    const fees = config.transaction_costs;
    const receipt = fees.action_receipt_creation_config;
    const callFee = fees.action_creation_config.function_call_cost;
    const byteFee = fees.action_creation_config.function_call_cost_per_byte;
    let gasFee = Big(0);
    let gasReserve = Big(0);
    let deposit = Big(0);
    txs.forEach((tx) => {
        const send = tx.receiverId === account.accountId ? 'send_sir' : 'send_not_sir';
        let sendGas = Big(receipt[send]);
        let executionGas = Big(receipt.execution);
        tx.actions.forEach((action) => {
            const call = action.functionCall;
            if (call) {
                const bytes =
                    Buffer.byteLength(call.methodName, 'utf8') + call.args.length;
                sendGas = sendGas
                    .plus(callFee[send])
                    .plus(Big(byteFee[send]).times(bytes));
                executionGas = executionGas
                    .plus(call.gas.toString())
                    .plus(callFee.execution)
                    .plus(Big(byteFee.execution).times(bytes));
                deposit = deposit.plus(call.deposit.toString());
            }
        });
        gasFee = gasFee.plus(sendGas.plus(executionGas).times(currentPrice));
        gasReserve = gasReserve
            .plus(sendGas.times(currentPrice))
            .plus(executionGas.times(purchasePrice));
    });
    const extraDeposit = deposit.minus(nativePrincipalRaw);
    return {
        // Estimate using the gas budget at the current price, not the refundable reserve.
        estimatedFee: fromRaw(gasFee.plus(extraDeposit).toFixed(0), 24),
        requiredNearBalance: fromRaw(gasReserve.plus(extraDeposit).toFixed(0), 24),
    };
}
