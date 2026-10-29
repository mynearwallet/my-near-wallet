# Ticket response for an implicit account migration passphrase

- Reviewed: 19 October 2026
- Account: `dd58b9eba4f7d9a6c408c7304a8045010e628915c1deeb665e8319d0d10b240f`
- Network checked: mainnet
- Branch rechecked: `master`, verified against GitHub's branch tip
- MyNearWallet revision: `49a1a414b77d1f903ca2ad8872835e0c484da2d6`

## Assessment

**A known migration flow generates exactly this kind of 32-character string.** NEAR Wallet Selector's account-export package generates a Base64 passphrase from 24 random bytes. The result is 32 characters and can contain `+` and `/`, matching the reported format. It is a password for an encrypted account export, not an account's Ed25519 private key or seed phrase.

The best-supported explanation is that the user saved this migration passphrase and subsequently entered it into the wrong import flow. This remains a hypothesis about their particular note: the ticket provides only a truncated example, no export payload, and no exact source wallet URL.

**Do not close the ticket as unrecoverable yet.** The matching encrypted migration URL or payload, surviving browser wallet data, a destination wallet that retained a key, or another backup could still provide a recovery path. The passphrase by itself cannot reconstruct the account private key.

There is an additional account-specific constraint: at the recorded chain snapshot below, the account had two full-access keys, and neither was the original public key encoded in its implicit address. Decrypting an old export is therefore only useful for control of this account if it yields a key that is still authorized, or enables an independently configured recovery method.

## Current branch verification

The follow-up review checked the current `master` checkout and queried GitHub's branch tips with a read-only `git ls-remote`. GitHub's `master` is `49a1a414b77d1f903ca2ad8872835e0c484da2d6`, the same commit used in the initial review. GitHub's `mainnet` is `7b13d175142a6fdc012fd6c7ba78b11425d918f4`; although its merge commit differs, both branches have the identical tracked tree `863dd807f07c612e78de5a463568bb13d270823a`. There are no source differences to invalidate the earlier crypto checks.

The distinction between historical evidence and current product behavior is important:

| Flow | Status on the checked branch | Relevance to this ticket |
| --- | --- | --- |
| Meteor Connect new-key transfer | The wallet's export banner leads through account selection and method selection into `/export-accounts/new-key-start`. | The current Meteor transfer creates destination keys and requires an existing usable source key. It cannot restore access from the old migration password alone. |
| Wallet Selector batch import | `/batch-import` still routes to `BatchImportAccounts`, which calls `decryptAccountData`. | A matching historical export and its 32-character password remain a source-supported import route. |
| Older `WalletMigration` export popup | Still mounted in `App.js`, but its state starts closed. The only method that opens it, `handleTransferClick`, has no call sites in the checked frontend source. | Treat its encoder and format mismatch as retained historical code, not evidence of a regression in the current visible Meteor export flow. |

The current path is established by [the export banner](../../packages/frontend/src/components/wallet/AccountExportBanner.jsx), [account selection](../../packages/frontend/src/components/account-export/AccountExportSelect.jsx), and [method selection](../../packages/frontend/src/components/account-export/AccountExportMethod.jsx). [The new-key start screen](../../packages/frontend/src/components/account-export/AccountExportNewKeyStart.jsx) calls `loadNewKeyTransferAccounts` and `startMeteorNewKeyAccountTransfer`. [Account eligibility](../../packages/frontend/src/components/account-export/accountExportAccounts.js) checks for a local signing key and full-access authorization; [the AddKey signer](../../packages/frontend/src/services/meteorConnectAddKeyChain.js) signs with that source key.

The newer [transfer recovery screen](../../packages/frontend/src/components/account-export/AccountExportNewKeyRecovery.jsx) reconciles recorded SDK transfer operations. It is not a facility for redeeming an arbitrary 2024 password or reconstructing a lost historical export. These new-key screens were introduced in 2026 and cannot explain a note generated in 2024.

**The ticket assessment is unchanged:** the reported format matches a historical Wallet Selector export password, while its exact origin remains unconfirmed. The recovery action is to find the matching old payload or a surviving authorized signer. The current migration UI does not remove that requirement. This review traced source entry points; it did not exercise a deployed wallet or repeat the earlier blockchain query.

## Suggested response to the user

> We found a NEAR wallet migration flow that generates a 32-character password with the format you described. In that flow, the password decrypts a separate account transfer and is not a private key. If this is the value you saved, Meteor rejecting it under “Import Private Key” is expected.
>
> Your account may still be recoverable if you can find the matching migration link or encrypted export. Please check saved notes, bookmarks, browser history, and restored tabs on the device and browser profile used for the migration. Look for a destination wallet URL containing `/batch-import`, especially the long data after `#` or a `hash=` parameter. Some history or sync records may not retain that data, so finding only the page address may not be enough. A later migration attempt can have a different password and must be matched to its own export.
>
> Please also check whether the original browser wallet, the destination wallet, or a device backup still has the account. Preserve that browser profile and its site data before clearing, reinstalling, or resetting anything.
>
> We also checked the public account record. It has two active full-access keys, so any recovered backup will need to be checked against those keys. This record alone does not establish what happened during your migration.
>
> Please tell us the original wallet website, the destination wallet, and whether you still have a migration link or the original browser profile. Do not send us your password, private key, seed phrase, or full migration link in this ticket; the password and matching link together can expose the exported keys.
>
> If only the 32-character password remains, with no matching export, surviving wallet data, usable key backup, or configured recovery method, we cannot recover the account from that password or account address alone.

## Repository findings

### The 32-character format comes from Wallet Selector account export

The frontend declares `@near-wallet-selector/account-export: ^7.6.1`. The lockfile resolves it to **7.9.3**, and the installed package agrees. This is not merely a present-day dependency: the historical tree at `d2bce33d7dc0a98f4ea59a3bd46f614eaf76e2e6` (27 November 2024) contains the same dependency and locked version. Commit `67e5ecc6977fabce1abfa85170db86343f6a47ce` introduced the Wallet Selector decryption integration on 8 February 2023.

The package's generator is:

```js
const generateSecretKey = () => {
  const random = nacl.randomBytes(24);
  return encodeBase64(random);
};
```

Twenty-four bytes encode as exactly 32 Base64 characters without padding. The package displays this value as its export passphrase, encrypts the selected accounts, and opens the destination import URL with the encrypted data in its fragment:

```text
<destination import URL>#<encrypted account data>
```

The wire format is:

```text
Base64(random nonce[24] || XSalsa20-Poly1305 secretbox(JSON(accountData)))
```

**Compatibility detail:** the encryption key is the UTF-8 encoding of the 32-character passphrase. The package's `decodeBase64(Buffer.from(secretKey).toString("base64"))` expression preserves those string bytes. Base64-decoding the passphrase itself produces 24 bytes and is not the correct decryption key.

The encrypted JSON contains account records including `accountId` and `privateKey`. The password and ciphertext are separate inputs; neither the account ID nor the password contains that encrypted JSON. There is no time-expiry check in the examined cryptographic flow, so an old matching pair can still decrypt. The recovered signing key may nevertheless have been revoked on chain.

Sources:

- [Frontend dependency](../../packages/frontend/package.json) and [lockfile](../../yarn.lock), entry `@near-wallet-selector/account-export@^7.6.1`.
- Installed `node_modules/@near-wallet-selector/account-export/index.cjs`, lines 4936–4985 for encryption, decryption, and generation; `Passphrase` and `browserOrMobileInterface` for the export UI and URL construction. This is an installed dependency, not a tracked source file.
- [Historical 2024 dependency](https://github.com/mynearwallet/my-near-wallet/blob/d2bce33d7dc0a98f4ea59a3bd46f614eaf76e2e6/packages/frontend/package.json) and [2023 integration commit](https://github.com/mynearwallet/my-near-wallet/commit/67e5ecc6977fabce1abfa85170db86343f6a47ce).
- [TweetNaCl secretbox documentation](https://github.com/dchest/tweetnacl-js#secret-key-authenticated-encryption-secretbox) describes the encryption primitive and key/nonce sizes.

This proves that a compatible flow existed during the reported period. It does not identify the website that generated this user's note. In this repo, the direct Wallet Selector integration is the **importer**; its own older migration exporter uses a different format, described below.

### MyNearWallet and Meteor both have a separate batch import flow

MyNearWallet's [batch importer](../../packages/frontend/src/components/accounts/batch_import_accounts/index.js), lines 288–305, passes two separate values into `decryptAccountData`:

```js
decryptAccountData({
  ciphertext: location.hash?.substring(1),
  secretKey: publicKey,
});
```

Despite the parameter name `publicKey`, this is the export password. After decryption, the importer extracts each account's actual `privateKey`.

The sibling Meteor repo has the same distinction:

- [Batch import initialization](../../../meteor_wallet/web/packages/meteor-common/src/modules_app_core/state/initializeApp.ts), lines 140–166, reads `/batch-import`, the `network` query parameter, and ciphertext from `hash=` or the URL fragment.
- [Batch import password screen](../../../meteor_wallet/web/packages/meteor-frontend/src/pages/batch_import_sections/Section_BatchImportDecrypt.tsx), lines 129–157, explicitly asks for the external site's decryption password and decrypts the supplied payload.
- [Account export crypto](../../../meteor_wallet/web/packages/meteor-frontend/src/utils/AccountExportCrypto.ts) implements the Wallet Selector wire format with `UTF8(secretKey)` and a 24-byte nonce.
- [Private key import](../../../meteor_wallet/web/packages/meteor-frontend/src/pages/wallet_import_sections/Section_EnterPrivateKey.tsx) instead invokes [private key validation](../../../meteor_wallet/web/packages/meteor-common/src/modules_utility/cryptography/SeedPhraseAndKeysUtil.ts), lines 127–158, which parses a signing key. Base64 characters such as `+` and `/` are outside the Base58 signing-key alphabet.

Meteor paths above were inspected at revision `d647f5c993a64a9143e12e2d06cf4e1b5846382d`. Their presence establishes a source-level recovery route; it does not verify which version is currently deployed.

For a compatible recovered payload, the source-supported Meteor URL shape is `/batch-import?network=mainnet#<ciphertext>`. A bare `/batch-import` page plus the password is insufficient. Use a verified wallet origin and a local, reviewed recovery process; do not paste secret-bearing links into online conversion tools.

### The repo also contains an incompatible older migration format

[WalletMigration.jsx](../../packages/frontend/src/components/wallet-migration/WalletMigration.jsx) obtains local signing keys, encrypts them into a URL payload, and displays a separate migration password through [MigrationSecret.jsx](../../packages/frontend/src/components/wallet-migration/MigrationSecret.jsx). Its [English text](../../packages/frontend/src/translations/locales/en/translation.json), under `walletMigration.migrationSecret`, calls this a password required to import accounts.

However, [encoding.js](../../packages/frontend/src/utils/encoding.js) uses a **Base58-encoded 32-byte value**, a static nonce, and a delimiter-separated account list, rather than the Wallet Selector JSON format. A typical generated password is 43–44 characters, and Base58 never includes `+` or `/`. Thirty-two bytes must not be confused with 32 encoded characters.

The legacy export format and the current Wallet Selector importer are incompatible. A synthetic legacy export was rejected by the current decryptor. The sibling Meteor repo retains a deprecated [legacy decoder](../../../meteor_wallet/web/packages/meteor-common/src/modules_external/near_official_wallet/utils/NaclEncryptionDecryption.ts), `decodeAccountsFrom`, which can inform an offline compatibility recovery if that format is actually found.

This is a reproduced format mismatch in retained legacy code, but it is **not established as the cause of this user's failed migration**, and its password format does not match the example. The current export banner does not invoke this old popup, so the mismatch should not be classified as a regression in the current Meteor Connect export flow. Do not try one format's password or decoder with the other format's payload. The 2026 account-transfer code is also not evidence of how a 2024 note was generated.

## Public account check

Read-only `query` calls to `https://rpc.mainnet.near.org` returned the following snapshot for both `view_account` and `view_access_key_list`:

- Final block: `220677726`.
- Block hash: `EXU3d3NctEEUtvyMKeVEZ1E498h83J2spz4MRzboS1GT`.
- Block timestamp: 19 October 2026, 15:54:09 UTC / 17:54:09 SAST.
- The account exists and has no deployed contract at that block (`code_hash` is the empty-code hash).

| Authorized public key | Permission |
| --- | --- |
| `ed25519:5bUsk7GESDUDj4XR684H6a8VGz1a7ndctxvBTvhezhpw` | FullAccess |
| `ed25519:6MX7KRiN5DgEp2vAJdmNfUyL4cPXnRozYJ3ee4u6j7it` | FullAccess |

The original public key represented by the account ID is:

```text
ed25519:Fu3a8MecCoL8JSvpMz4NM1GxT5JV9vX5xYYXqScPD4Az
```

It is absent from that key list. NEAR implicit account IDs encode the original public key; they do not guarantee that it remains authorized forever. See the protocol specifications for [implicit accounts](https://nomicon.io/DataStructures/Account#implicit-accounts) and [access keys](https://nomicon.io/DataStructures/AccessKey).

**Recovery must target a currently authorized key.** A recovered key does not have to derive to the original implicit address to be valid for this account. Conversely, a seed phrase or private key that reproduces the original address is insufficient if its key has been removed and no other recovery authorization exists. Re-query the live key list when evaluating any recovered candidate.

The snapshot does not identify the owners of the two keys, establish when they were added, or prove that the 2025 attempt succeeded, failed, or compromised the account. Review public `AddKey`/`DeleteKey` history and any migration transaction hashes before drawing those conclusions. An empty contract hash also means no recovery contract is deployed on this account at the checked block; it does not exclude other off-chain recovery services holding an authorized key.

## Recovery procedure for support and engineering

1. **Identify the source flow without collecting secrets.** Obtain the original wallet domain, destination wallet, approximate migration dates, exact character count, and whether the note contains `+` or `/`. Ask whether a complete migration URL, export file, old browser profile, hardware wallet, or destination wallet survives. The account was described as created in 2023; that date alone does not identify its wallet application or recovery configuration.

2. **Preserve the old devices and profiles.** Before running wallet code or resetting anything, make a protected copy of the relevant browser profile/site data. Check each original origin separately, including the exact historical `wallet.near.org` or MyNearWallet origin the user used. Browser storage is origin-specific. This repo's keystore prefix is `nearlib:keystore:`; the mainnet entry has the shape `nearlib:keystore:<accountId>:mainnet`. Password-protected MyNearWallet data can instead be under `MNW_WALLET_DATA` and requires the wallet's unlock password. That unlock password and the migration passphrase serve different purposes. See [wallet initialization](../../packages/frontend/src/utils/wallet.ts) and [encrypted wallet storage](../../packages/frontend/src/utils/encryptedWalletData.ts).

3. **Look for the matching ciphertext.** Check saved URLs, bookmarks, browser/session backups, restored tabs, and copied export data around both the 2024 and 2025 attempts. Preserve the complete fragment or query value. A URL stripped of everything after `#` has lost the Wallet Selector ciphertext. History and sync may omit fragments. Repeating the migration generates another secret/payload pair; an earlier note need not decrypt the later attempt. These examined flows do not provide an account-ID endpoint for retrieving a lost encrypted export.

4. **Decrypt locally with the matching format.** For the 32-character Base64 passphrase, use the Wallet Selector-compatible decryptor with the original string's UTF-8 bytes. Preserve case and symbols. Restore URL percent-encoding only as appropriate for the recorded URL; avoid turning literal `+` into spaces or decoding twice. For the older Base58/static-nonce format, use a reviewed legacy decoder. Successful decryption should yield the target account record and a signing key. Do not log or commit decrypted records.

5. **Verify authorization before importing or changing keys.** Derive the recovered signing key's public key locally, and compare it with a fresh `view_access_key_list` response for this exact account and network. If it is authorized, import it for the existing account using a supported import path; do not assume address derivation alone will discover an account whose keys changed. If it is revoked, check the destination wallet, backups of newer keys, hardware wallet, or an already configured recovery service. An old revoked key cannot authorize a replacement key by itself.

6. **After restoring access, create a durable backup.** Have the user securely back up the usable seed phrase/private key or hardware-wallet recovery material and verify the backup before removing any working access. If recovery material has been disclosed, replace affected access keys through the restored wallet.

7. **Close with a conditional finding if all recovery sources are exhausted.** With only this migration passphrase and the public account ID, and no matching export, surviving signing key/seed, usable wallet storage, hardware signer, or configured recovery path, recovery is not possible through the examined flows. Adding `ed25519:`, changing encodings, or treating the password as a seed cannot reconstruct the missing account key. Support cannot reset ownership from an account address.

## Verification and follow-up

Synthetic checks against the installed 7.9.3 package's actual crypto functions confirmed:

- The generator produces a 32-character string: Base64-decoding it yields 24 bytes, while its UTF-8 encoding gives the 32 bytes used by secretbox.
- The generated passphrase decrypts a matching synthetic account export and restores its signing key exactly; an independent secretbox decode gives the same JSON.
- A different generated passphrase fails authenticated decryption.
- Private-key parsing rejects the generated passphrase even with an `ed25519:` prefix.
- A legacy export from this repo's actual encoder fails in the Wallet Selector decryptor.

These checks used synthetic accounts only. No real user secret or migration ciphertext was supplied, and no signing, import, or on-chain mutation was performed. A documentation-only change does not require the application build or full application test suite.

Keep this ticket open pending the source/destination details and the search for the matching payload or surviving wallet data. Clearer migration-password guidance in private-key import could help similar users. If an actual legacy payload is found, evaluate explicit format handling or a reviewed offline decoder; the mismatch alone does not establish a defect in the current visible transfer flow. Neither follow-up changes the fact that a missing ciphertext cannot be recreated from the migration password alone.
