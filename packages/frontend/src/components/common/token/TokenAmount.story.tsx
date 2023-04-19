import type { Meta, StoryObj } from '@storybook/react'
import TokenAmount from './TokenAmount';

const meta: Meta<typeof TokenAmount> = {
  title: 'Components/Common/TokenAmount',
  component: TokenAmount,
};

export default meta;
type Story = StoryObj<typeof TokenAmount>;

export const Primary: Story = {
  args: {
    token: {
        balance: "2000",
        onChainFTMetadata: {
            decimals: 2,
            icon: "",
            name: "",
            reference: "",
            reference_hash: "",
            spec: "",
            symbol: "USD",
        },
        fiatValueMetadata: {
            last_updated_at: 10,
            usd: 20,
        }
    },
    showFiatAmount: true,
    withSymbol: true,
    balancePrefix: "",
  },
};
