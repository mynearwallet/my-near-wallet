import React, { useState, useEffect } from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

const SettingsWrapper = styled.div`
    padding: 1rem 0 0;
`;

const Option = styled.div`
    display: flex;
    align-items: center;
`;

const MarkButton = styled.button`
    padding: .5rem 1rem;
    border-radius: .3rem;
    border: 1px solid #F0F0F1;
    background-color: none;

    &.active {
        background: #0072ce;
        color: white;
    }

    &:not(:last-child) {
        margin-right: 2%;
    }
`;

const MARKS = [0.1, 0.5, 1, 5];
const DEFAULT_SLIPPAGE = MARKS[1];

export default function SwapSettings({ onChange }) {
    const [slippage, setSlippage] = useState(String(DEFAULT_SLIPPAGE));

    const onSettingsChange = (event) => {
        setSlippage(event.target.value);
    };

    useEffect(() => {
        onChange({
            slippage: Number(slippage),
        });
    }, [slippage]);

    return (
        <SettingsWrapper onClick={onSettingsChange}>
            <Translate id="swap.slippage" />
            <Option>
                {MARKS.map((percent, i) => (
                    <MarkButton
                        value={percent}
                        key={i}
                        className={`${String(percent) === slippage ? 'active' : ''}`}
                    >
                        {percent}%
                    </MarkButton>
                ))}
                <input type="number" value={slippage} onChange={onSettingsChange} />
            </Option>
        </SettingsWrapper>
    );
}
