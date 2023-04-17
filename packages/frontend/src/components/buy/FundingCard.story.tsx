import type { Meta, StoryObj } from '@storybook/react'
import { FundingCard } from './FundingCard';

const meta: Meta<typeof FundingCard> = {
  title: 'Components/FundingCard',
  component: FundingCard,
};

export default meta;
type Story = StoryObj<typeof FundingCard>;

export const Primary: Story = {
  args: {
    title: "buyNear.nearPurchaseTitle",
    subTitle: "buyNear.nearPurchaseSubTitle",
    actions: [],
    link: {
        title: "Link Title",
        url: "some url"
    }
  },
};
