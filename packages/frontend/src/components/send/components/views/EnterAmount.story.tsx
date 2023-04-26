import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { DEFAULT_TOKEN_METADATA } from '../../../../../.storybook/token';
import { StyledContainer } from '../../SendContainerV2';
import { EnterAmount } from './EnterAmount';

const meta: Meta<typeof EnterAmount> = {
    title: 'Components/Send/EnterAmount',
    component: EnterAmount,
    decorators: [
        (Story) => (
            <StyledContainer className='small-centered'>
                <Story />
            </StyledContainer>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof EnterAmount>;

export const Primary: Story = {
    args: {
        amount: '100',
        rawAmount: '100',
        availableToSend: '100',
        continueAllowed: true,
        isMobile: true,
        selectedToken: {
            balance: '100',
            onChainFTMetadata: {
                ...DEFAULT_TOKEN_METADATA,
                symbol: 'Token',
            },
        },
        error: '',
        onContinue: () => null,
        onClickCancel: () => null,
        onClickSelectToken: () => null,
        onChangeAmount: () => null,
        onSetMaxAmount: () => null,
    },
};

export const WithWarning: Story = {
    args: {
        amount: '100',
        rawAmount: '100',
        availableToSend: '100',
        continueAllowed: true,
        isMobile: true,
        selectedToken: {
            balance: '100',
            onChainFTMetadata: {
                ...DEFAULT_TOKEN_METADATA,
                symbol: 'Bridged Token',
                isBridged: true,
            },
        },
        error: '',
        onContinue: () => null,
        onClickCancel: () => null,
        onClickSelectToken: () => null,
        onChangeAmount: () => null,
        onSetMaxAmount: () => null,
    },
};
