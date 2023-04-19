import type { Meta, StoryObj } from "@storybook/react";
import { AmountInput } from "./AmountInput";

const meta: Meta<typeof AmountInput> = {
  title: "Components/Send/AmountInput",
  component: AmountInput,
};

export default meta;
type Story = StoryObj<typeof AmountInput>;

export const Primary: Story = {
  args: {
    error: "",
    value: "200",
    autoFocus: false,
    maxLength: 18,
  },
};
