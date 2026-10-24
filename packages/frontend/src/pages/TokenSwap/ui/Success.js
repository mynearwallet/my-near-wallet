import React, { useState } from 'react';
import { Translate } from 'react-localize-redux';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import FormButton from '../../../components/common/FormButton';
import SafeTranslate from '../../../components/SafeTranslate';
import AvatarSuccessIcon from '../../../components/svg/AvatarSuccessIcon';
import FailIcon from '../../../components/svg/FailIcon';
import useIsMounted from '../../../hooks/useIsMounted';
import { toSignificantDecimals } from '../../../utils/amounts';
import { actions as swapActions } from '../../../redux/slices/swap';
import { useSwapData } from '../model/Swap';
import { DECIMALS_TO_SAFE } from '../utils/constants';
import fungibleTokenExchange from '../../../services/tokenExchange';
import RecoverableBalances from './RecoverableBalances';

const StyledContainer = styled.div`
    > svg {
        margin: 30px auto;
        display: block;
    }
`;

const StyledHeader = styled.div`
    text-align: center;
    line-height: 140%;
    color: #272729;
    font-weight: 600;
    font-size: 20px;
`;

const FailTitle = styled.div`
    margin-bottom: 1rem;
`;

const Reason = styled.p`
    font-weight: 400;
`;

const ButtonsWrapper = styled.div`
    margin-top: 55px;

    > button {
        display: block;
        width: 100%;
    }
`;

const noop = () => {};

export default function Success({
    onClickContinue = noop,
    onClickGoToExplorer,
    account,
}) {
    const dispatch = useDispatch();
    const {
        swapState: { tokenIn, amountIn, tokenOut, amountOut, lastSwapState = {} },
        events: { setCompletedSwapState },
    } = useSwapData();

    const { success, unconfirmed, hash: swapHash, failReason } = lastSwapState || {};
    const [checking, setChecking] = useState(false);
    const [checkError, setCheckError] = useState('');
    const isMounted = useIsMounted();
    const checkResult = async () => {
        if (
            !account ||
            !swapHash ||
            checking ||
            account.accountId !== lastSwapState.quote?.context.accountId
        ) {
            return;
        }
        setChecking(true);
        setCheckError('');
        try {
            const result = await fungibleTokenExchange.checkSwapResult({
                account,
                quote: lastSwapState.quote,
                hash: swapHash,
            });
            if (!isMounted()) {
                return;
            }
            setCompletedSwapState({
                ...lastSwapState,
                success: result.success,
                unconfirmed: result.unconfirmed,
                failReason: result.failReason,
                hash: result.swapTxHash || swapHash,
                amountOut: result.amountOut || lastSwapState.amountOut,
                quote: result.quote || lastSwapState.quote,
            });
            if (!result.unconfirmed) {
                const tokenIds = [
                    tokenIn?.contractName,
                    tokenOut?.contractName,
                    ...(result.routeTokenIds || lastSwapState.quote?.routeTokenIds || []),
                ]
                    .filter(Boolean)
                    .map((id) => fungibleTokenExchange.replaceNearIdIfNecessary(id));
                dispatch(
                    swapActions.updateTokensBalance({
                        accountId: account.accountId,
                        tokenIds: [...new Set(tokenIds)],
                    })
                );
            }
        } catch (error) {
            if (isMounted()) {
                setCheckError(error.message);
            }
        } finally {
            if (isMounted()) {
                setChecking(false);
            }
        }
    };

    const successData = {
        amountFrom: `${toSignificantDecimals(amountIn, DECIMALS_TO_SAFE)} ${
            tokenIn?.onChainFTMetadata?.symbol
        }`,
        amountTo: `${toSignificantDecimals(
            lastSwapState?.amountOut || amountOut,
            DECIMALS_TO_SAFE
        )} ${tokenOut?.onChainFTMetadata?.symbol}`,
    };

    return (
        <StyledContainer className='buttons-bottom'>
            {unconfirmed ? (
                <StyledHeader>
                    {swapHash
                        ? 'Swap status unknown. Check the transaction before swapping again.'
                        : 'Swap status unknown. Check your account history before swapping again.'}
                    {checkError && <Reason>{checkError}</Reason>}
                </StyledHeader>
            ) : success ? (
                <>
                    <AvatarSuccessIcon />
                    <StyledHeader data-test-id='swapPageSuccessMessage'>
                        <SafeTranslate id='swap.successTitle' data={successData} />
                    </StyledHeader>
                </>
            ) : (
                <>
                    <FailIcon />
                    <StyledHeader>
                        <FailTitle>
                            <SafeTranslate id='swap.failTitle' />
                        </FailTitle>
                        {failReason && (
                            <Reason className='font-monospace'>{failReason}</Reason>
                        )}
                    </StyledHeader>
                </>
            )}
            <ButtonsWrapper>
                {unconfirmed && swapHash && (
                    <FormButton onClick={checkResult} disabled={checking}>
                        {checking ? 'Checking...' : 'Check transaction status'}
                    </FormButton>
                )}
                <FormButton
                    data-test-id='swapPageContinueAfterSwapButton'
                    onClick={onClickContinue}
                    disabled={unconfirmed && !!swapHash}
                >
                    <Translate id='button.continue' />
                </FormButton>

                {swapHash && (
                    <FormButton color='gray-gray' onClick={onClickGoToExplorer}>
                        <Translate id='button.viewOnExplorer' />
                    </FormButton>
                )}
            </ButtonsWrapper>
            {!success && !unconfirmed && lastSwapState.quote?.source === 'v2' && (
                <RecoverableBalances account={account} />
            )}
        </StyledContainer>
    );
}
