import type { Meta, StoryObj } from '@storybook/react'
import Modal from './Modal';

const meta: Meta<typeof Modal> = {
  title: 'Components/Common/Modal',
  component: Modal,
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Primary: Story = {
  args: {
    isOpen: true,
    children: <div>HELLO</div>,
    modalSize: 'sm',
    modalClass: 'slim',
    closeButton: true,
    disableClose: false,
    mobileActionSheet: true,
  },
};
