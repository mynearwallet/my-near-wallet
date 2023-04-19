import type { Meta, StoryObj } from '@storybook/react'
import { TabSelector } from './TabSelector';

const meta: Meta<typeof TabSelector> = {
  title: 'Components/Send/TabSelector',
  component: TabSelector,
};

export default meta;
type Story = StoryObj<typeof TabSelector>;

export const Primary: Story = {};
