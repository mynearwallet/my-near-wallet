import type { Meta, StoryObj } from '@storybook/react'
import { RiscScoringForm } from './RiscScoringForm';

const meta: Meta<typeof RiscScoringForm> = {
  title: 'Components/Send/RiscScoringForm',
  component: RiscScoringForm,
};

export default meta;
type Story = StoryObj<typeof RiscScoringForm>;

export const Primary: Story = {
  args: {
    isIgnored: false,
    setIsRSIgnored: () => null,
  },
};
