# Meteor Connect upgrade

The frontend now uses published `@meteorwallet/sdk` **3.18.0**. Its bridge dependencies
resolve to `@meteorwallet/connect` and `@meteorwallet/connect-shared` **0.25.0** in
`yarn.lock`. The SDK owns connection/platform selection and pairing UI; the host's
new-key transfer, chain activation and journal recovery APIs remain unchanged.

## SDK release dependency

SDK 3.18.0 did not map the new `wallet_confirmation` phase into its pairing UI.
The fix is implemented in the sibling `meteor_wallet_sdk` repo and must be published
under a new SDK version. After publication, replace 3.18.0 in
`packages/frontend/package.json`, run `yarn install`, and commit the updated lockfile.
No local package links or generated-bundle patches are used by this upgrade.

Ordinary/new-key requests use explicit first-link consent inside the destination
wallet. Existing-key transfer still requires a fresh PIN. My NEAR Wallet must not
supply a PIN override, sign wallet consent, or infer authorization from app metadata.

Validation on 3.18.0: four targeted integration suites (54 tests), the production
Parcel bundle, and TypeScript 5.3.3 all pass. Invoke the frontend type check as
`node ../../node_modules/typescript/bin/tsc --noEmit`; this checkout's Yarn `tsc`
shim selects a different transitive compiler. The corrected SDK also passes its
isolated published-package consumption gate, including Vite and Parcel.

Before deployment, repeat first-link confirmation/cancellation, remembered linking,
new-key start/verify, fresh-PIN existing-key transfer, and revoked-link flows against
the upgraded destination wallets and protocol-3 backend.
