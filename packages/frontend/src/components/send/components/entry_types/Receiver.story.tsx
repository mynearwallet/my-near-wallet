import type { Meta, StoryObj } from '@storybook/react'
import { Receiver } from './Receiver';

const meta: Meta<typeof Receiver> = {
  title: 'Components/Send/Receiver',
  component: Receiver,
};

export default meta;
type Story = StoryObj<typeof Receiver>;

export const Primary: Story = {
  args: {
    translateIdTitle: "sendV2.TXEntry.title.receiverId",
    receiverId: "some receiver id"
  },
};
