import React, { Suspense } from 'react';
import { I18nextProvider } from 'react-i18next';
import { LocalizeProvider } from "react-localize-redux";
import i18n from '../src/translations';
import { store } from '../src'

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

const withI18next = (Story) => {
  return (
    // This catches the suspense from components not yet ready (still loading translations)
    // Alternative: set useSuspense to false on i18next.options.react when initializing i18next
    <Suspense fallback={<div>loading translations...</div>}>
        <LocalizeProvider store={store}>
            <I18nextProvider i18n={i18n}>
                <Story />
            </I18nextProvider>
        </LocalizeProvider>
    </Suspense>
  );
};

// export decorators for storybook to wrap your stories in
export const decorators = [withI18next];

export default preview;
