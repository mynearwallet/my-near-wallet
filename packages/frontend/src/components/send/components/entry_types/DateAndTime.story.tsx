import type { Meta, StoryObj } from "@storybook/react";
import { DateAndTime } from "./DateAndTime";

const meta: Meta<typeof DateAndTime> = {
  title: "Components/Send/DateAndTime",
  component: DateAndTime,
};

export default meta;
type Story = StoryObj<typeof DateAndTime>;

export const Primary: Story = {
  args: {
    timeStamp: "2141512",
    translateIdTitle: "wallet.dateAndTime",
  },
};
