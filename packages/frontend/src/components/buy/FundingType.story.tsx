import type { Meta, StoryObj } from '@storybook/react';

import { FundingType } from './FundingType';

const meta: Meta<typeof FundingType> = {
    title: 'Components/FundingType',
    component: FundingType,
};

export default meta;
type Story = StoryObj<typeof FundingType>;

export const Primary: Story = {
    args: {
        icon: 'near',
        link: 'link',
        name: 'some name',
        disabled: false,
        track: () => null,
    },
};
