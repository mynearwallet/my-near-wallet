import type { Meta, StoryObj } from "@storybook/react";
import { Token } from "./Token";

const meta: Meta<typeof Token> = {
  title: "Components/Send/Token",
  component: Token,
};

export default meta;
type Story = StoryObj<typeof Token>;

export const Primary: Story = {
  args: {
    symbol: "USD",
    icon: "",
    translateIdTitle: "sendV2.selectTokenButtonTitle",
    onClick: () => null,
  },
};
