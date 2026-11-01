import React from 'react';
import styled from 'styled-components';

import { SUNSET_PHASE, SUNSET_PHASE_SOURCE } from '../../config/sunset';

const Chip = styled.div`
    background: #24272a;
    border-radius: 999px;
    bottom: 16px;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    left: 16px;
    line-height: 18px;
    padding: 6px 12px;
    position: fixed;
    z-index: 1000;

    a {
        color: #9bd5ff;
        margin-left: 8px;
    }
`;

/**
 * Visible only when a non-mainnet build runs a `?sunset_phase=N` QA override, so nobody mistakes
 * an overridden staging session for the build's real behaviour. Intentionally untranslated.
 */
export default function SunsetQaChip() {
    if (SUNSET_PHASE_SOURCE !== 'qa-override') {
        return null;
    }

    return (
        <Chip>
            QA: sunset phase {SUNSET_PHASE}
            <a href={`${window.location.pathname}?sunset_phase=`}>reset</a>
        </Chip>
    );
}
