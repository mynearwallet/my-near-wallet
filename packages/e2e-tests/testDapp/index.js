// eslint-disable-next-line no-undef
const { connect, keyStores, WalletConnection, utils } = nearApi;

(async () => {
    const { DEFAULT_NEAR_CONFIG, BANK_ACCOUNT } = await fetch('./configData.json').then(
        (res) => res.json()
    );

    const config = {
        ...DEFAULT_NEAR_CONFIG,
        keyStore: new keyStores.BrowserLocalStorageKeyStore(),
    };
    const near = await connect(config);

    const wallet = new WalletConnection(near);

    const walletAccountId = wallet.getAccountId();

    const PENDING_ACCESS_KEY_PREFIX = 'pending_key';

    const loginFullAccess = async (options) => {
        const currentUrl = new URL(window.location.href);
        const newUrl = new URL(wallet._walletBaseUrl + '/login/');
        newUrl.searchParams.set('success_url', options.successUrl || currentUrl.href);
        newUrl.searchParams.set('failure_url', options.failureUrl || currentUrl.href);

        const accessKey = utils.KeyPair.fromRandom('ed25519');
        newUrl.searchParams.set('public_key', accessKey.getPublicKey().toString());
        await wallet._keyStore.setKey(
            wallet._networkId,
            PENDING_ACCESS_KEY_PREFIX + accessKey.getPublicKey(),
            accessKey
        );

        window.location.assign(newUrl.toString());
    };

    if (walletAccountId) {
        document.getElementById('content').innerHTML = `
          <span data-test-id="testDapp-currentUser">
            Currently Logged in as: ${walletAccountId}
          </span>
          <button id="signOutBtn" data-test-id="testDapp-signOutBtn">
            Sign out
          </button>`;
        document.getElementById('signOutBtn').addEventListener('click', async () => {
            wallet.signOut();
            location.reload();
        });
    } else {
        document.getElementById('content').innerHTML = `
        <button id="signInBtn" data-test-id="testDapp-signInBtn">
            Sign in
        </button>
        <button id="signInWithFAKBtn" data-test-id="testDapp-signInWithFAKBtn">
            Sign in with a full access key
        </button>
        `;
        document
            .getElementById('signInBtn')
            .addEventListener('click', () => wallet.requestSignIn(BANK_ACCOUNT));
        document
            .getElementById('signInWithFAKBtn')
            .addEventListener('click', () => loginFullAccess({}));
    }
})();
