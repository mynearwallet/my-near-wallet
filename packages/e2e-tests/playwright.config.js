require("dotenv").config();

const { devices, expect } = require("@playwright/test");
const { matchers } = require("expect-playwright");

expect.extend(matchers);

const config = {
    globalSetup: require.resolve("./global-setup.js"),
    reporter: [["./reporters/WalletE2eLogsReporter.js", { logger: console }], ["./reporters/pagerduty-reporter.js"]],
    webServer: {
        command:
            "cd ../frontend && npx serve dist -l 1234 -s --ssl-cert devServerCertificates/primary.crt --ssl-key devServerCertificates/private.pem",
        port: 1234,
        timeout: 120 * 1000,
        reuseExistingServer: false,
    },
    timeout: 60000,
    use: {
        baseURL: process.env.WALLET_URL || "https://wallet.testnet.near.org",
        headless: true,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        storageState: {
            origins: [
                {
                    origin: process.env.WALLET_URL || "https://wallet.testnet.near.org",
                    localStorage: [{ name: "wallet.releaseNotesModal:v0.01.2:closed", value: "true" }],
                },
            ],
        },
    },
    projects: [
        {
            name: "Desktop_Chromium",
            use: {
                browserName: "chromium",
            },
        },
        {
            name: "Desktop_Firefox",
            use: {
                browserName: "firefox",
                viewport: { width: 800, height: 600 },
            },
        },
        {
            name: "Mobile_Chrome",
            use: devices["Pixel 5"],
        },
        {
            name: "Desktop_Safari",
            use: {
                browserName: "webkit",
                viewport: { width: 1200, height: 750 },
            },
        },
        {
            name: "Mobile_Safari",
            use: devices["iPhone 12"],
        },
    ],
};

module.exports = config;
