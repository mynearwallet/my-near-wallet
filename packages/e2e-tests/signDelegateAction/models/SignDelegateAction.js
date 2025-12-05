/**
 * Page Object Model for SignDelegateAction flow
 * Tests NEP-366 meta-transaction signing
 */

const queryString = require('query-string');

class SignDelegateActionPage {
    constructor(page) {
        this.page = page;
    }

    /**
     * Build the URL parameters for sign-delegate-action
     */
    buildUrlParams({ receiverId, actions, callbackUrl, meta }) {
        const params = {
            receiverId,
            actions: JSON.stringify(actions),
            callbackUrl,
        };
        if (meta) {
            params.meta = JSON.stringify(meta);
        }
        return queryString.stringify(params);
    }

    /**
     * Navigate to sign-delegate-action with parameters
     */
    async navigate({ receiverId, actions, callbackUrl, meta }) {
        const params = this.buildUrlParams({ receiverId, actions, callbackUrl, meta });
        await this.page.goto(`/sign-delegate-action?${params}`);
    }

    /**
     * Navigate with raw URL (for testing malformed params)
     */
    async navigateRaw(queryString) {
        await this.page.goto(`/sign-delegate-action?${queryString}`);
    }

    /**
     * Click the approve button to sign the delegate action
     */
    async approve() {
        await this.page.click('data-test-id=approve-delegate-action');
    }

    /**
     * Click the cancel/reject button
     */
    async cancel() {
        await this.page.click('data-test-id=reject-delegate-action');
    }

    /**
     * Get the displayed account ID
     */
    async getDisplayedAccountId() {
        return this.page.textContent('.detail-value >> nth=0');
    }

    /**
     * Get the displayed contract/receiver ID
     */
    async getDisplayedReceiverId() {
        return this.page.textContent('.detail-value >> nth=1');
    }

    /**
     * Get the displayed method name(s)
     */
    async getDisplayedMethodNames() {
        const methods = await this.page.$$('.action-method');
        return Promise.all(methods.map((m) => m.textContent()));
    }

    /**
     * Check if the gasless badge is visible
     */
    async isGaslessBadgeVisible() {
        return this.page.isVisible('.gasless-badge');
    }

    /**
     * Check if error state is shown
     */
    async isErrorVisible() {
        return this.page.isVisible('.error-details');
    }

    /**
     * Get error message text
     */
    async getErrorMessage() {
        return this.page.textContent('.error-details');
    }

    /**
     * Check if approve button is disabled
     */
    async isApproveDisabled() {
        return this.page.isDisabled('data-test-id=approve-delegate-action');
    }

    /**
     * Wait for redirect to callback URL
     */
    async waitForCallbackRedirect(callbackUrl, timeout = 10000) {
        await this.page.waitForURL(new RegExp(callbackUrl), { timeout });
    }

    /**
     * Parse callback URL parameters after redirect
     */
    getCallbackParams() {
        const url = new URL(this.page.url());
        return {
            accountId: url.searchParams.get('accountId'),
            publicKey: url.searchParams.get('publicKey'),
            signedDelegateAction: url.searchParams.get('signedDelegateAction'),
            errorCode: url.searchParams.get('errorCode'),
            errorMessage: url.searchParams.get('errorMessage'),
        };
    }
}

module.exports = { SignDelegateActionPage };
