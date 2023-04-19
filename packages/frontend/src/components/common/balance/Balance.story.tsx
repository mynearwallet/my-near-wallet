import type { Meta, StoryObj } from "@storybook/react";
import Balance from "./Balance";

const meta: Meta<typeof Balance> = {
  title: "Components/Common/Balance",
  component: Balance,
};

export default meta;
type Story = StoryObj<typeof Balance>;

export const Primary: Story = {
  args: {
    totalAmount: "1000",
    amount: "990",
    showSymbolNEAR: true,
    showBalanceInNEAR: true,
    showBalanceInUSD: true,
    showAlmostEqualSignUSD: true,
    showSignUSD: true,
    showSymbolUSD: true,
  },
};
