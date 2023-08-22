require('dotenv').config();
const { devices } = require('@playwright/test');

const config = {
    fullyParallel: true,
    expect: {
        timeout: 60 * 1000, // unit is ms, default is 5s
    },
    globalSetup: require.resolve('./global-setup.js'),
    reporter: [
        ['./reporters/WalletE2eLogsReporter.js', { logger: console }],
        ['./reporters/pagerduty-reporter.js'],
    ],
    timeout: 5 * 60 * 1000,
    use: {
        baseURL: process.env.WALLET_URL || 'https://localhost:1234',
        headless: true,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        storageState: {
            origins: [
                {
                    origin: process.env.WALLET_URL || 'https://localhost:1234',
                    localStorage: [
                        {
                            name: 'wallet.releaseNotesModal:v0.01.2:closed',
                            value: 'true',
                        },
                    ],
                },
            ],
        },
    },
    projects: [
        {
            name: 'Desktop_Chromium',
            use: {
                browserName: 'chromium',
            },
        },
        {
            name: 'Desktop_Firefox',
            use: {
                browserName: 'firefox',
                viewport: { width: 800, height: 600 },
            },
        },
        {
            name: 'Mobile_Chrome',
            use: devices['Pixel 5'],
        },
        {
            name: 'Desktop_Safari',
            use: {
                browserName: 'webkit',
                viewport: { width: 1200, height: 750 },
            },
        },
        {
            name: 'Mobile_Safari',
            use: devices['iPhone 12'],
        },
    ],
};

module.exports = config;
