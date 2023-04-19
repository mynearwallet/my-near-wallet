import type { Meta, StoryObj } from "@storybook/react";
import { Receipt } from "./Receipt";

const meta: Meta<typeof Receipt> = {
  title: "Components/Send/Receipt",
  component: Receipt,
  argTypes: {
    status: {
      options: ["SuccessValue", "Failed", "notAvailable"],
      control: { type: "radio" },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Receipt>;

export const Primary: Story = {
  args: {
    status: "SuccessValue",
    token: {
      symbol: "USD",
      icon: "",
      amount: "200",
      decimals: 2,
    },
    network_fees: "2",
    receiver_id: "some-id",
    block_timestamp: 10000,
  },
};
