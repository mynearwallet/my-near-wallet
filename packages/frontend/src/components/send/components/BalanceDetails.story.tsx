import type { Meta, StoryObj } from '@storybook/react'
import { BalanceDetails } from './BalanceDetails';

const meta: Meta<typeof BalanceDetails> = {
  title: 'Components/Send/BalanceDetails',
  component: BalanceDetails,
};

export default meta;
type Story = StoryObj<typeof BalanceDetails>;

export const Primary: Story = {
  args: {
    availableToSend: "100",
    selectedToken: {
        onChainFTMetadata: {
            symbol: "USD",
            decimals: 2
        }
      }
    }
};
