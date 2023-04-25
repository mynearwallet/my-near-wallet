import type { Meta, StoryObj } from '@storybook/react';

import { InputAccountId } from './InputAccountId';

const meta: Meta<typeof InputAccountId> = {
    title: 'Components/Send/InputAccountId',
    component: InputAccountId,
};

export default meta;
type Story = StoryObj<typeof InputAccountId>;

export const Primary: Story = {
    args: {
        accountId: '',
        disabled: false,
        autoFocus: false,
        isSuccess: false,
        isProblem: false,
    },
};
