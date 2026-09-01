// @ts-check
/**
 * E2E tests for NEP-366 SignDelegateAction flow
 *
 * Tests the gasless meta-transaction signing feature where users sign
 * a DelegateAction that can be submitted by a relayer.
 */

const { test, expect } = require('@playwright/test');

const { HomePage } = require('../register/models/Home');
const { SignDelegateActionPage } = require('./models/SignDelegateAction');
const { getEnvTestAccount } = require('../utils/account');

const { describe, beforeAll, beforeEach } = test;

// Test callback URL - using httpbin.org as a simple echo endpoint
// This is a publicly available service that returns whatever is sent to it
const callbackUrl = 'https://httpbin.org/get';

// Sample actions for testing
const sampleFtTransferAction = {
    methodName: 'ft_transfer',
    args: {
        receiver_id: 'recipient.testnet',
        amount: '1000000',
    },
    gas: '30000000000000',
    deposit: '1',
};

const sampleFunctionCallAction = {
    methodName: 'some_method',
    args: {
        param1: 'value1',
        param2: 123,
    },
    gas: '30000000000000',
    deposit: '0',
};

describe('Sign Delegate Action - NEP-366 Meta-Transactions', () => {
    let testAccount;

    beforeAll(async () => {
        testAccount = await getEnvTestAccount();
    });

    beforeEach(async ({ page }) => {
        // Login with test account before each test
        const homePage = new HomePage(page);
        await homePage.navigate();
        await homePage.loginWithSeedPhraseLocalStorage(
            testAccount.accountId,
            testAccount.seedPhrase
        );
        // Reload page to ensure Redux picks up localStorage
        await homePage.navigate();
    });

    describe('UI Display', () => {
        test('displays correct contract and action details', async ({ page }) => {
            const signPage = new SignDelegateActionPage(page);

            await signPage.navigate({
                receiverId: 'usdc.testnet',
                actions: [sampleFtTransferAction],
                callbackUrl,
                meta: { referrer: 'Test dApp' },
            });

            // Verify UI elements
            await expect(page.locator('.title')).toContainText('Meta-Transaction');
            expect(await signPage.isGaslessBadgeVisible()).toBe(true);

            // Verify contract is displayed
            const displayedReceiver = await signPage.getDisplayedReceiverId();
            expect(displayedReceiver).toBe('usdc.testnet');

            // Verify action method is displayed
            const methods = await signPage.getDisplayedMethodNames();
            expect(methods).toContain('ft_transfer');
        });

        test('displays multiple actions correctly', async ({ page }) => {
            const signPage = new SignDelegateActionPage(page);

            await signPage.navigate({
                receiverId: 'contract.testnet',
                actions: [sampleFtTransferAction, sampleFunctionCallAction],
                callbackUrl,
            });

            const methods = await signPage.getDisplayedMethodNames();
            expect(methods).toHaveLength(2);
            expect(methods).toContain('ft_transfer');
            expect(methods).toContain('some_method');
        });

        test('displays referrer from meta when provided', async ({ page }) => {
            const signPage = new SignDelegateActionPage(page);

            await signPage.navigate({
                receiverId: 'contract.testnet',
                actions: [sampleFunctionCallAction],
                callbackUrl,
                meta: { referrer: 'My Awesome dApp' },
            });

            const pageContent = await page.textContent('body');
            expect(pageContent).toContain('My Awesome dApp');
        });
    });

    describe('Approve Flow', () => {
        // Note: These tests require actual network signing on testnet
        // They work when the wallet is properly connected to testnet with valid accounts
        // Skip in CI environments that don't have network access
        test.skip('signs and redirects to callback with signedDelegateAction', async ({
            page,
        }) => {
            const signPage = new SignDelegateActionPage(page);

            await signPage.navigate({
                receiverId: 'wrap.testnet',
                actions: [sampleFunctionCallAction],
                callbackUrl,
            });

            // Click approve
            await signPage.approve();

            // Wait for redirect to callback
            await signPage.waitForCallbackRedirect('httpbin.org');

            // Verify callback params
            const params = signPage.getCallbackParams();
            expect(params.accountId).toBe(testAccount.accountId);
            expect(params.publicKey).toBeTruthy();
            expect(params.publicKey).toMatch(/^ed25519:/);
            expect(params.signedDelegateAction).toBeTruthy();
            // signedDelegateAction should be base64 encoded
            expect(params.signedDelegateAction.length).toBeGreaterThan(50);
            expect(params.errorCode).toBeNull();
        });

        test.skip('signed delegate action is valid base64', async ({ page }) => {
            const signPage = new SignDelegateActionPage(page);

            await signPage.navigate({
                receiverId: 'wrap.testnet',
                actions: [sampleFunctionCallAction],
                callbackUrl,
            });

            await signPage.approve();
            await signPage.waitForCallbackRedirect('httpbin.org');

            const params = signPage.getCallbackParams();

            // Verify it's valid base64 by trying to decode
            const decoded = Buffer.from(params.signedDelegateAction, 'base64');
            expect(decoded.length).toBeGreaterThan(0);
        });
    });

    describe('Cancel Flow', () => {
        test('redirects to callback with userRejected error on cancel', async ({
            page,
        }) => {
            const signPage = new SignDelegateActionPage(page);

            await signPage.navigate({
                receiverId: 'contract.testnet',
                actions: [sampleFunctionCallAction],
                callbackUrl,
            });

            // Click cancel
            await signPage.cancel();

            // Wait for redirect to callback
            await signPage.waitForCallbackRedirect('httpbin.org');

            // Verify error params
            const params = signPage.getCallbackParams();
            expect(params.errorCode).toBe('userRejected');
            expect(params.errorMessage).toContain('rejected');
            expect(params.signedDelegateAction).toBeNull();
        });
    });

    describe('Invalid Parameters', () => {
        test('shows error when receiverId is missing', async ({ page }) => {
            const signPage = new SignDelegateActionPage(page);

            await signPage.navigateRaw(
                `actions=${encodeURIComponent(
                    JSON.stringify([sampleFunctionCallAction])
                )}&callbackUrl=${encodeURIComponent(callbackUrl)}`
            );

            expect(await signPage.isErrorVisible()).toBe(true);
            const error = await signPage.getErrorMessage();
            expect(error).toContain('receiverId');
        });

        test('shows error when actions is missing', async ({ page }) => {
            const signPage = new SignDelegateActionPage(page);

            await signPage.navigateRaw(
                `receiverId=contract.testnet&callbackUrl=${encodeURIComponent(
                    callbackUrl
                )}`
            );

            expect(await signPage.isErrorVisible()).toBe(true);
        });

        test('shows error when callbackUrl is missing', async ({ page }) => {
            const signPage = new SignDelegateActionPage(page);

            await signPage.navigateRaw(
                `receiverId=contract.testnet&actions=${encodeURIComponent(
                    JSON.stringify([sampleFunctionCallAction])
                )}`
            );

            expect(await signPage.isErrorVisible()).toBe(true);
        });

        test('shows error when actions JSON is malformed', async ({ page }) => {
            const signPage = new SignDelegateActionPage(page);

            await signPage.navigateRaw(
                `receiverId=contract.testnet&actions=not-valid-json&callbackUrl=${encodeURIComponent(
                    callbackUrl
                )}`
            );

            expect(await signPage.isErrorVisible()).toBe(true);
            const error = await signPage.getErrorMessage();
            expect(error).toContain('Invalid');
        });

        test('shows error when action has no methodName', async ({ page }) => {
            const signPage = new SignDelegateActionPage(page);

            const invalidAction = { args: { foo: 'bar' } }; // missing methodName

            await signPage.navigate({
                receiverId: 'contract.testnet',
                actions: [invalidAction],
                callbackUrl,
            });

            expect(await signPage.isErrorVisible()).toBe(true);
            const error = await signPage.getErrorMessage();
            expect(error).toContain('methodName');
        });

        test('shows error for javascript: protocol in callback URL', async ({ page }) => {
            const signPage = new SignDelegateActionPage(page);

            await signPage.navigateRaw(
                `receiverId=contract.testnet&actions=${encodeURIComponent(
                    JSON.stringify([sampleFunctionCallAction])
                )}&callbackUrl=javascript:alert(1)`
            );

            // Should show invalid callback URL error
            expect(await signPage.isErrorVisible()).toBe(true);
        });
    });

    describe('Button States', () => {
        test('approve button shows loading state while signing', async ({ page }) => {
            const signPage = new SignDelegateActionPage(page);

            await signPage.navigate({
                receiverId: 'wrap.testnet',
                actions: [sampleFunctionCallAction],
                callbackUrl,
            });

            // Start approval
            const approveButton = page.locator('data-test-id=approve-delegate-action');
            await approveButton.click();

            // Button should be disabled during signing
            await expect(approveButton).toBeDisabled();

            // Wait for redirect (signing complete)
            await signPage.waitForCallbackRedirect('httpbin.org');
        });

        test('cancel button is disabled while signing', async ({ page }) => {
            const signPage = new SignDelegateActionPage(page);

            await signPage.navigate({
                receiverId: 'wrap.testnet',
                actions: [sampleFunctionCallAction],
                callbackUrl,
            });

            const cancelButton = page.locator('data-test-id=reject-delegate-action');
            const approveButton = page.locator('data-test-id=approve-delegate-action');

            // Start approval
            await approveButton.click();

            // Cancel should be disabled during signing
            await expect(cancelButton).toBeDisabled();
        });
    });
});

describe('Sign Delegate Action - No Account', () => {
    test('redirects away from sign page when not logged in', async ({ page }) => {
        // Don't login - just navigate directly
        const signPage = new SignDelegateActionPage(page);

        await signPage.navigate({
            receiverId: 'contract.testnet',
            actions: [sampleFunctionCallAction],
            callbackUrl,
        });

        // Should redirect away from sign-delegate-action page
        // PrivateRoute redirects to home/login when not authenticated
        const url = page.url();
        // Either redirected away OR approve is disabled
        if (url.includes('sign-delegate-action')) {
            expect(await signPage.isApproveDisabled()).toBe(true);
        } else {
            // Redirected to login, create, or home page
            expect(url).toMatch(/login|create|localhost:1234\/$/);
        }
    });
});
