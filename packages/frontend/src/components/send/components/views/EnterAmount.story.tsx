import type { Meta, StoryObj } from "@storybook/react";
import { EnterAmount } from "./EnterAmount";

const meta: Meta<typeof EnterAmount> = {
  title: "Components/Send/EnterAmount",
  component: EnterAmount,
};

export default meta;
type Story = StoryObj<typeof EnterAmount>;

export const Primary: Story = {
  args: {
    amount: "200",
    rawAmount: "100",
    availableToSend: "100",
    continueAllowed: true,
    error: "",
    isMobile: false,
    selectedToken: {
      onChainFTMetadata: {
        symbol: "USD",
        decimals: 2,
      },
    },
  },
};
