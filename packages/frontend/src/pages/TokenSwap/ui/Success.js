import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import FormButton from '../../../components/common/FormButton';
import SafeTranslate from '../../../components/SafeTranslate';
import AvatarSuccessIcon from '../../../components/svg/AvatarSuccessIcon';
import FailIcon from '../../../components/svg/FailIcon';
import { useSwapData } from '../model/Swap';

const StyledContainer = styled.div`
    > svg {
        margin: 30px auto;
        display: block;
    }
`;

const Header = styled.div`
    text-align: center;
    line-height: 140%;
    color: #272729;
    font-weight: 600;
    font-size: 20px;
    word-break: break-all;
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

export default function Success({ onClickContinue, onClickGoToExplorer }) {
    const {
        swapState: { tokenIn, amountIn, tokenOut, amountOut, lastSwapState = {} },
    } = useSwapData();

    const { success, hash: swapHash, failReason } = lastSwapState;

    const successData = {
        amountFrom: `${amountIn} ${tokenIn?.onChainFTMetadata?.symbol}`,
        amountTo: `${amountOut} ${tokenOut?.onChainFTMetadata?.symbol}`,
    };

    return (
        <StyledContainer className="buttons-bottom">
            {success ? (
                <>
                    <AvatarSuccessIcon />
                    <Header>
                        <SafeTranslate
                            id="swap.successTitle"
                            data={successData}
                            data-test-id="swapPageSuccessMessage"
                        />
                    </Header>
                </>
            ) : (
                <>
                    <FailIcon />
                    <Header>
                        <FailTitle>
                            <SafeTranslate id="swap.failTitle" />
                        </FailTitle>
                        {failReason && (
                            <Reason className="font-monospace">{failReason}</Reason>
                        )}
                    </Header>
                </>
            )}
            <ButtonsWrapper>
                <FormButton
                    data-test-id="swapPageContinueAfterSwapButton"
                    onClick={onClickContinue}
                >
                    <Translate id="button.continue" />
                </FormButton>

                {typeof onClickGoToExplorer === 'function' && swapHash && (
                    <FormButton color="gray-gray" onClick={onClickGoToExplorer}>
                        <Translate id="button.viewOnExplorer" />
                    </FormButton>
                )}
            </ButtonsWrapper>
        </StyledContainer>
    );
}
