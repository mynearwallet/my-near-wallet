import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import SkeletonLoading from '../../../components/common/SkeletonLoading';

const infoMinHeight = '3rem';

const SwapInfoWrapper = styled.div`
    padding: .5rem 0;
    min-height: ${infoMinHeight};
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
`;

export default function SwapInfo({ data }) {
    const {
        info: { minAmountOut },
        loading,
    } = data;

    return (
        <SwapInfoWrapper>
            {loading ? (
                <SkeletonLoading height={infoMinHeight} show/>
            ) : (
                <>
                    <Row>
                        <Translate id="swap.minReceived" />: {minAmountOut || '--'}
                    </Row>
                </>
            )}
        </SwapInfoWrapper>
    );
}
