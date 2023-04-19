import type { Meta, StoryObj } from "@storybook/react";
import { Information } from "./Information";

const meta: Meta<typeof Information> = {
  title: "Components/Send/Information",
  component: Information,
};

export default meta;
type Story = StoryObj<typeof Information>;

export const Primary: Story = {
  args: {
    translateIdTitle: "sendV2.TXEntry.title.from",
    informationValue: "20",
    onClick: () => null,
  },
};
