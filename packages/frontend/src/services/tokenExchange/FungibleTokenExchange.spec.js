import { FungibleTokenExchange } from './FungibleTokenExchange';
import { createQuoteContext, QUOTE_REFRESH_INTERVAL_MS } from './quotes';
import { dispatchTransactionsExecutor } from '../../redux/slices/sign/transactionExecutor';

jest.mock('./SmartRouterV2', () => ({ __esModule: true, default: {} }));
jest.mock('./RefFinanceContract', () => ({ __esModule: true, default: {} }));
jest.mock('../FungibleTokens', () => ({ fungibleTokensService: {} }));
jest.mock('../../redux/slices/sign/transactionExecutor', () => ({
    dispatchTransactionsExecutor: jest.fn(),
}));
jest.mock('../../utils/wallet', () => ({ wallet: {} }));
jest.mock('../../config', () => ({
    __esModule: true,
    default: { CURRENT_NEAR_NETWORK: 'mainnet', NEAR_ID: 'NEAR', NEAR_TOKEN_ID: 'wrap.near' },
}));

const token = (contractName) => ({
    contractName,
    onChainFTMetadata: { decimals: 6 },
});
const request = () => ({
    account: { accountId: 'alice.near' },
    tokenIn: token('a.near'),
    tokenOut: token('b.near'),
    amountIn: '1',
    slippage: 1,
});
const v2Quote = (params, changes = {}) => ({
    source: 'v2',
    context: createQuoteContext(params),
    quotedAt: Date.now(),
    amountOut: '1',
    amountOutRaw: '1000000',
    minAmountOut: '0.99',
    minAmountOutRaw: '990000',
    outputDecimals: 6,
    priceImpactPercent: '1',
    estimatedFee: '0.001',
    requiredNearBalance: '0.01',
    registrationKey: '',
    routeTokenIds: ['a.near', 'b.near'],
    transactions: [{ receiverId: 'a.near', actions: [] }],
    execution: { msg: 'opaque', signature: 'signed' },
    ...changes,
});

let exchangeContract;
let router;
let service;

beforeEach(() => {
    jest.clearAllMocks();
    exchangeContract = {
        estimate: jest.fn().mockResolvedValue({ amountOut: '0.9', poolId: 1, swapFee: '0.3', priceImpactPercent: '1' }),
        getSwapActions: jest.fn().mockResolvedValue([]),
    };
    router = { getQuote: jest.fn(), interpretResult: jest.fn() };
    service = new FungibleTokenExchange({ exchaingeContract: exchangeContract, tokenService: {}, router });
});

test('compares V2 with the existing Ref estimate and preserves the Ref fallback', async () => {
    const params = request();
    router.getQuote.mockResolvedValue(v2Quote(params));
    expect((await service.estimate(params)).v2Quote).toBeDefined();
    exchangeContract.estimate.mockResolvedValueOnce({ amountOut: '1.1', poolId: 2 });
    expect(await service.estimate(params)).toEqual({ amountOut: '1.1', poolId: 2 });
    router.getQuote.mockRejectedValueOnce(new Error('Router unavailable'));
    expect((await service.estimate(params)).poolId).toBe(1);
});

test('submits the displayed signed V2 quote and reviews a worse expired quote', async () => {
    const params = request();
    const quote = v2Quote(params);
    dispatchTransactionsExecutor.mockResolvedValue({ success: true, txHash: 'hash', data: [] });
    router.interpretResult.mockReturnValue({ success: true, amountOutRaw: '999999' });
    const result = await service.swap({ ...params, v2Quote: quote });
    expect(router.getQuote).not.toHaveBeenCalled();
    expect(dispatchTransactionsExecutor).toHaveBeenCalledWith(
        quote.transactions,
        'alice.near',
        expect.objectContaining({ captureUnknown: true, shouldContinue: expect.any(Function) })
    );
    expect(result.amountOut).toBe('0.999999');

    dispatchTransactionsExecutor.mockClear();
    router.getQuote.mockResolvedValue({ ...quote, minAmountOutRaw: '980000' });
    const expired = { ...quote, quotedAt: Date.now() - QUOTE_REFRESH_INTERVAL_MS };
    const review = await service.swap({ ...params, v2Quote: expired });
    expect(review.reviewRequired).toBe(true);
    expect(review.quote.v2Quote.minAmountOutRaw).toBe('980000');
    expect(dispatchTransactionsExecutor).not.toHaveBeenCalled();
});

test('keeps the original wrap branch', async () => {
    const params = request();
    params.tokenIn = token('NEAR');
    params.tokenOut = token('wrap.near');
    expect(await service.estimate(params)).toEqual({ amountOut: '1' });
    expect(router.getQuote).not.toHaveBeenCalled();
});
