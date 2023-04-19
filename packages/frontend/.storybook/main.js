import webpack from 'webpack'

/** @type { import('@storybook/react-webpack5').StorybookConfig } */
const config = {
  stories: ["../src/**/*.mdx", "../src/**/*.story.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    disableTelemetry: true,
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  env: (config) => ({
    ...config,
    NEAR_WALLET_ENV: "testnet"
  }),
  webpackFinal: async (config) => {
    config.resolve.fallback = {
        ...config.resolve.fallback,
        process: require.resolve("process/browser"),
        zlib: require.resolve("browserify-zlib"),
        stream: require.resolve("stream-browserify"),
        util: require.resolve("util"),
        fs: false,
        buffer: require.resolve("buffer"),
        asset: require.resolve("assert"),
    }
    config.plugins.push(
        new webpack.ProvidePlugin({
            Buffer: ["buffer", "Buffer"],
            process: "process/browser",
          }),
    )

    return config;
  },
};
export default config;
