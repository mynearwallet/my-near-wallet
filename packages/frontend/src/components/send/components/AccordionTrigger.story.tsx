import type { Meta, StoryObj } from "@storybook/react";
import { AccordionTrigger } from "./AccordionTrigger";

const meta: Meta<typeof AccordionTrigger> = {
  title: "Components/Send/AccordionTrigger",
  component: AccordionTrigger,
};

export default meta;
type Story = StoryObj<typeof AccordionTrigger>;

export const Primary: Story = {
  args: {
    translateData: "100",
    translateIdTitle: "sendV2.accordionTriggerTitle.transactionDetails",
    open: true,
  },
};
