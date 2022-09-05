import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const SettingsWrapper = styled.div``;

const MarkButton = styled.button``;

const MARKS = [0.1, 0.5, 1];
const DEFAULT_SLIPPAGE = MARKS[1];

// @todo add custom slippage input
export default function SwapSettings({ onChange }) {
    const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);

    const onSettingsChange = (event) => {
        setSlippage(Number(event.target.value));
    };

    useEffect(() => {
        onChange({
            slippage,
        });
    }, [slippage]);

    return (
        <SettingsWrapper onClick={onSettingsChange}>
            <p>Slippage tolerance:</p>
            {MARKS.map((percent, i) => (
                <MarkButton value={percent} key={i}>
                    {percent}%
                </MarkButton>
            ))}
        </SettingsWrapper>
    );
}
