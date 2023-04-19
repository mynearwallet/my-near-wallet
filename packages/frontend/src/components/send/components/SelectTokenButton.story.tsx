import type { Meta, StoryObj } from "@storybook/react";
import { SelectTokenButton } from "./SelectTokenButton";

const meta: Meta<typeof SelectTokenButton> = {
  title: "Components/Send/SelectTokenButton",
  component: SelectTokenButton,
};

export default meta;
type Story = StoryObj<typeof SelectTokenButton>;

export const Primary: Story = {
  args: {
    token: {
      onChainFTMetadata: {
        symbol: "USD",
        icon: "",
      },
    },
    onClick: () => null,
  },
};
