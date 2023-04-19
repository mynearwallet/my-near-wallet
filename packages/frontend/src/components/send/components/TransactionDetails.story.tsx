import type { Meta, StoryObj } from '@storybook/react'
import { TransactionDetails } from './TransactionDetails';

const meta: Meta<typeof TransactionDetails> = {
  title: 'Components/Send/TransactionDetails',
  component: TransactionDetails,
};

export default meta;
type Story = StoryObj<typeof TransactionDetails>;

export const Primary: Story = {
  args: {
    selectedToken: {
        onChainFTMetadata: {
            icon: "",
            symbol: "USD",
            decimals: 2,
        }
    },
    estimatedFeesInNear: '100',
    estimatedTotalInNear: '1000',
    amount: '2000',
  },
};
