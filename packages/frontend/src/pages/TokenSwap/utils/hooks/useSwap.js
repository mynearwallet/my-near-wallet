import Big from 'big.js';
import { useMemo, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import CONFIG from '../../../../config';
import { Mixpanel } from '../../../../mixpanel';
import { showCustomAlert } from '../../../../redux/actions/status';
import selectNEARAsTokenWithMetadata from '../../../../redux/selectors/crossStateSelectors/selectNEARAsTokenWithMetadata';
import { actions } from '../../../../redux/slices/swap';
import fungibleTokenExchange from '../../../../services/tokenExchange';
import { useSwapData, VIEW_STATE } from '../../model/Swap';

const { updateTokensBalance } = actions;

const getUsdVolume = (amount, usdPrice) => {
    return !amount || typeof usdPrice !== 'number'
        ? 'Unavailable'
        : Big(amount).times(usdPrice).toFixed();
};

const getAmountStats = ({ tokenIn, amountIn, tokenOut, amountOut, nearUsdPrice }) => {
    const tokenInId = fungibleTokenExchange.replaceNearIdIfNecessary(
        tokenIn.contractName
    );
    const tokenOutId = fungibleTokenExchange.replaceNearIdIfNecessary(
        tokenOut.contractName
    );

    if (
        fungibleTokenExchange.isNearTransformation({ tokenIn, tokenOut }) ||
        tokenInId === CONFIG.NEAR_TOKEN_ID
    ) {
        return {
            volumeNear: amountIn,
            volumeUSD: getUsdVolume(amountIn, nearUsdPrice),
        };
    }

    if (tokenOutId === CONFIG.NEAR_TOKEN_ID) {
        return {
            volumeNear: amountOut,
            volumeUSD: getUsdVolume(amountOut, nearUsdPrice),
        };
    }

    return {
        inputAmountUSD: getUsdVolume(amountIn, tokenIn.fiatValueMetadata.usd),
    };
};

export default function useSwap({
    account,
    amountIn,
    poolId,
    tokenIn,
    tokenOut,
    minAmountOut,
    isNearTransformation,
    v2Quote,
    slippage,
}) {
    const nearConfig = useSelector((state) =>
        selectNEARAsTokenWithMetadata(state, { includeNearContractName: true })
    );
    const dispatch = useDispatch();
    const {
        events: { setSwapPending, setCompletedSwapState, setViewState, setSwapEstimate },
    } = useSwapData();

    const current = useRef();
    const inFlight = useRef(false);
    const mounted = useRef(true);
    current.current = { account, amountIn, tokenIn, tokenOut, slippage, v2Quote };
    useEffect(() => () => {
        mounted.current = false;
    }, []);

    const swap = useMemo(() => {
        if (
            !account ||
            !amountIn ||
            (!v2Quote && !isNearTransformation && poolId == null) ||
            !tokenIn ||
            !tokenOut ||
            !minAmountOut
        ) {
            return null;
        }

        const isCurrent = () => mounted.current &&
            current.current.account?.accountId === account.accountId &&
            current.current.amountIn === amountIn &&
            current.current.tokenIn?.contractName === tokenIn.contractName &&
            current.current.tokenOut?.contractName === tokenOut.contractName &&
            current.current.slippage === slippage && current.current.v2Quote === v2Quote;
        return async () => {
            if (inFlight.current || !isCurrent()) {
                return;
            }
            inFlight.current = true;
            setSwapPending(true);

            const statisticalParameters = {
                tokenFrom: tokenIn.onChainFTMetadata.symbol,
                tokenFromAddress: tokenIn.contractName,
                tokenTo: tokenOut.onChainFTMetadata.symbol,
                tokenToAddress: tokenOut.contractName,
                ...getAmountStats({
                    tokenIn,
                    amountIn,
                    tokenOut,
                    amountOut: minAmountOut,
                    nearUsdPrice: nearConfig.fiatValueMetadata.usd,
                }),
            };

            try {
                const result =
                    await fungibleTokenExchange.swap({
                        account,
                        amountIn,
                        poolId,
                        tokenIn,
                        tokenOut,
                        minAmountOut,
                        v2Quote,
                        slippage,
                        isCurrent,
                    });
                const { swapTxHash, success, failReason, retry, unconfirmed } = result;
                if (result.reviewRequired) {
                    if (isCurrent()) {
                        setSwapEstimate(result.quote);
                        dispatch(showCustomAlert({
                            success: false,
                            messageCodeHeader: 'swap.review',
                            errorMessage: 'Price changed. Review the updated quote before confirming.',
                        }));
                    }
                    return;
                }

                if (retry) {
                    return;
                }

                Mixpanel.track(`Swap:${success ? 'done' : 'failed'}`, {
                    failReason,
                    ...statisticalParameters,
                });

                await dispatch(
                    updateTokensBalance({
                        accountId: account.accountId,
                        tokenIds: [
                            fungibleTokenExchange.replaceNearIdIfNecessary(
                                tokenIn.contractName
                            ),
                            fungibleTokenExchange.replaceNearIdIfNecessary(
                                tokenOut.contractName
                            ),
                        ],
                    })
                );
                setCompletedSwapState({
                    success,
                    unconfirmed,
                    accountId: account.accountId,
                    quote: result.quote,
                    amountOut: result.amountOut,
                    hash: swapTxHash,
                    failReason,
                    tokenIn: tokenIn.onChainFTMetadata.symbol,
                    tokenOut: tokenOut.onChainFTMetadata.symbol,
                });
                if (mounted.current && current.current.account?.accountId === account.accountId) {
                    setViewState(VIEW_STATE.result);
                }
            } catch (error) {
                if (!isCurrent()) {
                    return;
                }
                Mixpanel.track('Swap:failed', {
                    failReason: error.message,
                    ...statisticalParameters,
                });
                dispatch(
                    showCustomAlert({
                        success: false,
                        messageCodeHeader: 'swap.error',
                        errorMessage: error.message,
                    })
                );
            } finally {
                inFlight.current = false;
                if (mounted.current) {
                    setSwapPending(false);
                }
            }
        };
    }, [
        dispatch,
        account,
        amountIn,
        poolId,
        tokenIn,
        tokenOut,
        minAmountOut,
        isNearTransformation,
        v2Quote,
        slippage,
    ]);

    return swap;
}
