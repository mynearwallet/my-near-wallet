const createPassword = async (page) => {
    await page.fill('data-test-id=password', '12345678abcdEFGH.');
    await page.fill('data-test-id=confirm-password', '12345678abcdEFGH.');
    await page.click('data-test-id=recovery-warn');
    await page.click('data-test-id=password-manager-warn');
    await page.click('data-test-id=set-password');
};

module.exports = {
    createPassword,
};
