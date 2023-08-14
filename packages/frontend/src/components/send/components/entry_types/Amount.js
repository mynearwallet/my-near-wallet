import React from 'react';
import { Translate } from 'react-localize-redux';

import StyledContainer from './css/Style.css';
import Tooltip from '../../../common/Tooltip';
import RawTokenAmount from '../RawTokenAmount';

const Amount = ({
    className,
    symbol,
    amount,
    decimals,
    translateIdTitle,
    translateIdInfoTooltip,
    isApproximate,
    'data-test-id': testId,
}) => {
    /* TODO: Handle long amounts */
    return (
        <StyledContainer className={className} data-test-id={testId}>
            <Translate id={translateIdTitle} />
            {translateIdInfoTooltip && <Tooltip translate={translateIdInfoTooltip} />}
            <div className='amount'>
                {isApproximate && '~'}
                <RawTokenAmount
                    symbol={symbol}
                    amount={amount}
                    decimals={decimals}
                    showFiatAmountForNonNearToken={false}
                />
            </div>
        </StyledContainer>
    );
};

export default Amount;
