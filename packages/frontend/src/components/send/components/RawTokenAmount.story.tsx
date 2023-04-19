import type { Meta, StoryObj } from '@storybook/react'
import { RawTokenAmount } from './RawTokenAmount';

const meta: Meta<typeof RawTokenAmount> = {
  title: 'Components/Send/RawTokenAmount',
  component: RawTokenAmount,
};

export default meta;
type Story = StoryObj<typeof RawTokenAmount>;

export const Primary: Story = {
  args: {
    symbol: "USD",
    amount: '2000',
    showFiatAmountForNonNearToken: true,
    decimals: 2,
    withSymbol: true
  },
};
