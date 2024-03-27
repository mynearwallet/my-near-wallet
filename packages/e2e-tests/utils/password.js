const createPassword = async (page) => {
    try {
        await page.fill('data-test-id=password', '12345678abcdEFGH.');
        await page.fill('data-test-id=confirm-password', '12345678abcdEFGH.');
        await page.click('data-test-id=recovery-warn');
        await page.click('data-test-id=password-manager-warn');
        await page.click('data-test-id=set-password');
    } catch (e) {
        await unlockPassword(page);
    }
};

const unlockPassword = async (page) => {
    try {
        await page.fill('data-test-id=password', '12345678abcdEFGH.');
        await page.click('data-test-id=unlock');
    } catch (e) {
        return;
    }
};

module.exports = {
    createPassword,
    unlockPassword,
};
