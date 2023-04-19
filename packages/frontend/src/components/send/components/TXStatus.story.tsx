import type { Meta, StoryObj } from "@storybook/react";
import { TXStatus } from "./TXStatus";

const meta: Meta<typeof TXStatus> = {
  title: "Components/Send/TXStatus",
  component: TXStatus,
  argTypes: {
    status: {
      options: ["SuccessValue", "Failed", "notAvailable"],
      control: { type: "radio" },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TXStatus>;

export const Primary: Story = {
  args: {
    status: "SuccessValue",
  },
};
