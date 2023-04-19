import type { Meta, StoryObj } from '@storybook/react'
import { Amount } from './Amount';

const meta: Meta<typeof Amount> = {
  title: 'Components/Send/Amount',
  component: Amount,
};

export default meta;
type Story = StoryObj<typeof Amount>;

export const Primary: Story = {
  args: {
    symbol: "USD",
    amount: "2000",
    decimals: 2,
    translateIdTitle: "sendV2.TXEntry.title.availableBalance",
    translateIdInfoTooltip: "sendV2.translateIdInfoTooltip.estimatedFees",
    isApproximate: true,
  },
};
