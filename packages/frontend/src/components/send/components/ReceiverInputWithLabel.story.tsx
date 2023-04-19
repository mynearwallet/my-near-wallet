import type { Meta, StoryObj } from '@storybook/react'
import { ReceiverInputWithLabel } from './ReceiverInputWithLabel';

const meta: Meta<typeof ReceiverInputWithLabel> = {
  title: 'Components/Send/ReceiverInputWithLabel',
  component: ReceiverInputWithLabel,
};

export default meta;
type Story = StoryObj<typeof ReceiverInputWithLabel>;

export const Primary: Story = {
  args: {
    receiverId: 'some receiver id',
    localAlert: "some alert",
    isSuccess: true,
    isProblem: false,
    checkAccountAvailable: () => null,
    setIsImplicitAccount:() => null,
    clearLocalAlert: () => null,
    handleChangeReceiverId: () => null
  },
};
