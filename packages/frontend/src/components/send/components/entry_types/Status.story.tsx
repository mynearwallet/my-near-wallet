import type { Meta, StoryObj } from "@storybook/react";
import { Status } from "./Status";

const meta: Meta<typeof Status> = {
  title: "Components/Send/Status",
  component: Status,
  argTypes: {
    status: {
      options: ["SuccessValue", "Failed", "notAvailable"],
      control: { type: "radio" },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Status>;

export const Primary: Story = {
  args: {
    translate: "sendV2.TXEntry.status.SuccessValue",
    status: "SuccessValue",
  },
};
