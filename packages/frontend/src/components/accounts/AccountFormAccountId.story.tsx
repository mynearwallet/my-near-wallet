import type { Meta, StoryObj } from '@storybook/react';

import { AccountFormAccountId } from './AccountFormAccountId';

const meta: Meta<typeof AccountFormAccountId> = {
    title: 'Components/Account/AccountFormAccountId',
    component: AccountFormAccountId,
};

export default meta;
type Story = StoryObj<typeof AccountFormAccountId>;

export const Primary: Story = {
    args: {
        type: 'check',
        disabled: false
    },
};
