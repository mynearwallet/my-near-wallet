import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { LocalAlertBox } from './LocalAlertBox';

const meta: Meta<typeof LocalAlertBox> = {
    title: 'Components/Common/LocalAlertBox',
    component: LocalAlertBox,
    decorators: [
        (Story) => (
            <div style={{ margin: '3em' }}>
                <Story />
            </div>
        ),
    ]
};

export default meta;
type Story = StoryObj<typeof LocalAlertBox>;

export const Primary: Story = {
    args: {
        localAlert: {
            success: false,
            show: true,
            messageCode: 'NFTTransfer.transferNft'
        },
        accountId: '21415212',
        dots: false,
    },
};
