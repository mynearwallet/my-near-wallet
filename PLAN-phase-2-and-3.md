# MyNearWallet Sunset: Phase 2 & Phase 3 Implementation Plan

| | |
| --- | --- |
| **Source** | [MyNearWallet Sunset POA](docs/mnw-sunset-plan/Private%20&%20Shared/MyNearWallet%20Sunset%20POA%203611c55b1a62806bb352d12a79a7075a.md) |
| **Scope** | Phase 2 (Migration-Focused Experience) and Phase 3 (Limited Functionality Mode) |
| **Codebase** | `packages/frontend`, as of `master` @ `4d6cad0a3` |
| **Prepared** | 29 October 2026 |
| **Status** | Draft. The decisions in [§4](#4-decisions-needed-before-build) need sign-off before build starts |

---

## 0. Read first: timing, and one fix needed before 31 October

**The calendar has overtaken the POA.** The POA puts Phase 2 in August–September and Phase 3 in October–December. Today is 29 October and Phase 2 has not shipped. The user-facing copy also contradicts itself:

| Where | What users see today |
| --- | --- |
| [SunsetNotice.tsx](packages/frontend/src/app/SunsetNotice.tsx) (modal, every 4 days) | "…planned to be deprecated on **31 October 2026**" |
| `accountExport.banner.description` (home banner) | "…will be fully sunset by the **end of 2026**" |
| POA timeline | Phase 3 runs until December; Phase 4 starts in 2027 |

From 1 November the modal will tell every user that the wallet has already been deprecated, while everything still works. That causes alarm and support load.

**Step 0 (ship before 31 Oct, independent of everything else):**
- [ ] Replace the hard date in `SunsetNotice` with wording that holds until the phase dates are agreed, for example: "MyNearWallet is being retired in stages. Please move your accounts to a supported wallet. Some features will be switched off over the coming weeks."
- [ ] Align the banner copy with it, in all 9 locales. If translations can't land in time, ship English now and translations with Phase 2.

**Proposed schedule** (needs confirmation, see D1):
- Phase 2 ships as soon as it is built, then runs **at least 3 weeks**.
- Phase 3 ships **no earlier than 14 days after** users first see an in-app notice giving its date.
- Phase 3 then runs until Phase 4 (2027).

Skipping straight to Phase 3 would remove send and unstake from users who have not yet moved, with no warning. That repeats the forced-friction mistake of the NEAR Wallet → MNW transition, which the POA explicitly calls out.

---

## 1. Goals and invariants

### Goals (from the POA)
1. Move users to supported wallets gradually, with Meteor presented as the preferred path.
2. Keep essential functionality in each phase. Phased-out features **redirect users into migration flows**; they must never dead-end.
3. Keep migration simple and guided. Avoid forced security complexity.
4. Communicate clearly and consistently in every phase.

### Invariants: these must hold in every phase
Every PR in this plan should be reviewed against this list. Each item gets an automated test where possible (see [§8](#8-cross-cutting-test-strategy)).

1. **Users can always get their keys out.** Unlock, manual export and the Profile "export private key" keep working for every account that has a local key.
2. **Migration flows are never gated.** All `/export-accounts/*` routes stay open, including resume, recovery, start-over, the NEAR.com guide and local removal. Their on-chain AddKey and DeleteKey calls (in [meteorConnectAddKeyChain.js](packages/frontend/src/services/meteorConnectAddKeyChain.js)) must never be blocked by a sunset guard.
3. **Disabling 2FA always works, without NEAR's 2FA service.** Meteor's new-key transfer refuses 2FA accounts (`two_factor_unsupported`), so disabling 2FA is a required migration step. It must not depend on NEAR's helper (see [§6.6.1](#661-turning-off-2fa-without-nears-2fa-service)). This also covers the seed-phrase route for bricked 2FA accounts.
4. **Getting in always works.** Log in, import, recover, password unlock, Ledger sign-in, `/batch-import` and `/recover-with-link` stay open.
5. **Funds stay visible.** Balances, tokens, NFTs, staking positions, lockup balances and activity remain viewable, read-only where necessary.
6. **Every dApp request gets an answer.** Each `/login`, `/sign`, `/sign-message` and `/verify-owner` request ends in a success or failure callback. None hangs, 404s, or drops into guest landing or an unlock screen with no way back.
7. **Gating is reversible.** Turning gating off is a config change and redeploy, not a code revert.
8. **Analytics stays clean.** No secrets, full URLs or URL fragments in analytics. The existing PostHog sanitisation still applies.

> **Client-side gating is UX, not security.** Accounts live on-chain and work from any wallet or CLI. The aim is to steer users toward migrating and to stop MNW *originating* new activity; we cannot (and should not try to) stop anyone using their own account.

---

## 2. Where we are (Phase 1 is complete)

| Delivered | Where |
| --- | --- |
| Sunset modal (every 4 days, hard-coded English) | [app/SunsetNotice.tsx](packages/frontend/src/app/SunsetNotice.tsx) |
| Home banner with migration entry and resume detection | [wallet/AccountExportBanner.jsx](packages/frontend/src/components/wallet/AccountExportBanner.jsx) |
| Account selection with eligibility probes (up to 30 accounts) | [AccountExportSelect.jsx](packages/frontend/src/components/account-export/AccountExportSelect.jsx), [accountExportAccounts.js](packages/frontend/src/components/account-export/accountExportAccounts.js) |
| Method choice: Meteor Connect new-key transfer (recommended), NEAR.com guide (mainnet only), manual export | [AccountExportMethod.jsx](packages/frontend/src/components/account-export/AccountExportMethod.jsx) |
| Meteor new-key transfer: crash-safe journal, activation, verification, recovery, start-over | `AccountExportNewKey*.jsx`, [services/meteorConnect.js](packages/frontend/src/services/meteorConnect.js) |
| Manual private-key reveal and copy | [AccountExportManual.jsx](packages/frontend/src/components/account-export/AccountExportManual.jsx) |
| Local-only removal of migrated accounts | [AccountExportRemove.jsx](packages/frontend/src/components/account-export/AccountExportRemove.jsx) |
| Detailed PostHog migration funnel (about 60 events) | [accountExportAnalytics.js](packages/frontend/src/components/account-export/accountExportAnalytics.js) |

**Gaps in Phase 1 that Phase 2 and 3 must close:**
- **Some accounts can't use any migration method.** Only `availability === 'available'` accounts can be selected, so manual export is offered only to accounts that are already eligible for Meteor. Ledger, 2FA, unfunded-implicit, `no_local_key` and `not_full_access` accounts get a one-line reason and no next step.
- **No feature gating exists.** There is no feature-flag system. `DISABLE_CREATE_ACCOUNT` (`true` on mainnet) **does not actually stop account creation**; see [§6.1](#61-disable-new-account-creation).
- **The modal is English-only** and its date is about to go stale.
- **The 2FA recovery path for bricked accounts can't be reached.** [AccountLock.jsx](packages/frontend/src/components/wallet-migration/AccountLock.jsx) (seed phrase → `disableMultisigWithFAK`) only opens from the legacy `WalletMigration` modal, and nothing opens that modal.

---

## 3. Capability matrix

This table is the single source of truth. The config in [§5.1](#51-phase-config-and-capability-model) encodes it directly.

✅ available · ⚠️ available with a migration notice · 🔒 read-only · ⛔ retired: entry points are hidden and direct URLs show the Feature Retired page · **Dn** = decision in [§4](#4-decisions-needed-before-build)

| Capability | Today (P1) | Phase 2 | Phase 3 |
| --- | --- | --- | --- |
| View balances, tokens, NFTs, activity | ✅ | ✅ | 🔒 |
| Log in, import, recover, unlock, Ledger sign-in | ✅ | ✅ | ⚠️ "you can import directly into your new wallet" |
| Migration flows (`/export-accounts/*`) | ✅ | ✅ | ✅ |
| Export private key (manual export and Profile) | ✅ | ✅, extended to all local keys | ✅, primary action |
| **Create account** (every path, including linkdrop "new account" and implicit/zero-balance creation) | ✅ | ⛔ | ⛔ |
| Import a key with no on-chain account (silent zero-balance implicit creation) | ✅ | ⛔ D10 | ⛔ |
| **Swap** | ✅ | ⛔ | ⛔ |
| Buy / on-ramp (MoonPay, UTORG, Transak, exchange links) | ✅ | ⛔ D3 | ⛔ |
| Explore page | ✅ | ⚠️ (its nav slot becomes "Migrate") | ⛔ |
| **dApp: new connection** (`/login`, including CLI full-access login) | ✅ | ⛔ (dApp is sent a failure response) | ⛔ |
| dApp: sign transactions (`/sign`) | ✅ | ⚠️ D4 | ⛔ (dApp is sent a failure response) |
| dApp: sign message / verify owner | ✅ | ⚠️ D4 | ⛔ (dApp is sent a failure response) |
| **Send** NEAR / FT | ✅ | ⚠️ | ⛔ |
| NFT transfer | ✅ | ⚠️ | ⛔ (NFT stays viewable) |
| Receive page | ✅ | ⚠️ | ⛔; account ID shown read-only D6 |
| Linkdrop: claim into existing account | ✅ | ✅ | ⛔ D9 |
| **Stake**: native deposit, liquid stake, lockup pool select | ✅ | ⛔ D2 | ⛔ |
| **Unstake / withdraw / claim farm rewards** (native and liquid) | ✅ | ✅ | 🔒 (positions shown, actions hidden) |
| Lockup "transfer to wallet" | ✅ | ✅ | D7 |
| Enable 2FA | ✅ | ⛔ | ⛔ |
| **Disable 2FA** (including bricked-account seed-phrase path) | ✅ | ✅ | ✅ |
| Add seed-phrase recovery / add full-access key | ✅ | ✅ D12 | ⛔ |
| Enable, disable or reconnect Ledger | ✅ | ✅ | ⛔ |
| Revoke authorized-app keys | ✅ | ✅ | ✅ D8 |
| Remove full-access keys | ✅ | ✅ | ⛔ D8 (list stays viewable) |
| Ledger sign-in metadata AddKey (on-chain, implicit) | ✅ | ✅ | skipped |
| Password set / change / unlock (local only) | ✅ | ✅ | ✅ |
| RPC settings, support widget (Gleap), terms, privacy | ✅ | ✅ | ✅ |

**Rule:** once a capability is retired it stays retired in later phases. The config model below enforces this.

---

## 4. Decisions needed before build

Each has a recommendation, so the build can start on that default unless someone objects.

| # | Decision | Recommendation | Why |
| --- | --- | --- | --- |
| D1 | Phase dates and the final user-facing date | Phase 2 as soon as built, at least 3 weeks long. Phase 3 at least 14 days after its in-app announcement. Use one final date everywhere. | See §0. The POA's 31 Oct date has passed. |
| D2 | New staking deposits in Phase 2 | **Disable** (native, liquid, lockup pool selection) | The POA lists only "unstake" under Phase 2. New stakes take 2–3 days to unwind and pull users deeper into a wallet that is closing. |
| D3 | Buy / on-ramp in Phase 2 | **Disable** | Not mentioned in the POA. Funding a closing wallet runs against the migration goal. Partner relationships (MoonPay API key, helper `/moonpay/signURL`) should wind down too. |
| D4 | `/sign` and `/sign-message` for dApps in Phase 2 | **Keep, with a migration notice** on the signing screen. Block only `/login`. | MNW keeps **no record** of which dApps are connected (see §6.4), so "existing connection" can't be told apart from "new" at `/sign`. Blocking `/sign` in Phase 2 would break dApps that users already rely on to unstake or withdraw. |
| D5 | Error code returned to dApps | **Reuse the existing codes** (`USER_CANCELLED` for login, `userRejected` for sign) and put the sunset explanation in `errorMessage` | dApps already handle these. A new code risks unhandled-error UIs. near-connect shows `errorMessage` as the rejection reason. |
| D6 | Receive in Phase 3 | Retire the `/receive-money` page. **Keep the account ID visible and copyable** on the home screen and profile. | Users need their address to check migration. Funds sent later still land on-chain and are reachable from the new wallet. |
| D7 | Lockup "transfer to wallet" in Phase 3 | **Depends on Meteor supporting lockup accounts.** If Meteor shows and operates lockups, retire it. If not, keep it as an explicitly allowed migration-enabling action. | We must not leave lockup funds reachable only from MNW. |
| D8 | Key management in Phase 3 | Keep **revoking authorized-app keys** (security-positive; dApp keys keep working until revoked). **Retire full-access key removal and addition.** | Removing full-access keys is high-risk and belongs in the new wallet once access there is confirmed. |
| D9 | Linkdrop claim in Phase 3 | Retire, and tell users to claim the link with another wallet | Needs confirmation that Meteor or other wallets can claim NEAR linkdrops. If none can, keep claim-to-existing-account open. |
| D10 | Importing a key whose account doesn't exist on-chain | **Block from Phase 2**, with a clear message (§6.1.4) | Today this quietly *creates* a zero-balance implicit account. This is the same outcome as the mainnet creation flow. |
| D11 | Which "other supported wallets" we list | Get the list from NEAR Foundation | POA: Meteor is preferred, but users may migrate elsewhere manually. |
| D12 | Adding seed-phrase recovery in Phase 2 | **Keep** | It gives users a 12-word phrase that works in any wallet, which directly helps migration. Retire in Phase 3. |

**External dependencies** (owners must confirm before Phase 3):
- **NEAR's helper (`helper.mainnet.near.org`) and its 2FA service.** **Both** of MNW's existing 2FA disable paths depend on it:
  - `disableMultisig` needs its SMS/email confirmation.
  - `disableWithFAK`, used by the bricked-account path, calls its `/2fa/getAccessKey`.
  - Every 2FA transaction in MNW (send, unstake) also needs its confirmation.
  - The [2fa-recovery](https://github.com/Meteor-Wallet/2fa-recovery) app describes this service as "retired". **Confirm its status now.** If it is down, MNW's 2FA users already can't send, unstake or disable 2FA, and §6.6.1 becomes their only route out.
- **Meteor's 2FA confirm relay** (`meteor_backend_v2` `POST /api/relay/confirm_2fa`). §6.6.1 depends on it. **It must be hardened before MNW sends traffic to it:**
  - **Reject any non-zero deposit.** On NEAR the relayer pays deposits attached inside a meta-transaction, and they land in the sender's account. Today anyone can drain the relayer account with a `confirm` carrying a deposit (verify on testnet with a tiny amount).
  - Cap gas.
  - Rate-limit.
  - Check the target account's code hash, `get_num_confirmations == 2`, and that `request_id` exists before spending gas. Today it only checks the shape of the request.
  - Alert on the relayer's balance.
- **The Meteor Connect production bridge and Meteor's new-key import** must stay available through Phase 3.
- **Meteor feature support** for lockup accounts (D7), Ledger accounts, staking and liquid-staking views, and linkdrop claims (D9).
- **Indexers** (FastNear, Nearblocks) for account discovery during import.

---

## 5. Shared foundation (build once, used by both phases)

### 5.1 Phase config and capability model

**New file `packages/frontend/src/config/sunset.ts`.** Each capability records the phase it is *disabled from*, which makes the "stays retired" rule hold automatically:

```ts
export type SunsetPhase = 1 | 2 | 3;

export type SunsetCapability =
    | 'createAccount' | 'importNonExistentAccount' | 'swap' | 'buy' | 'explore'
    | 'dappConnect' | 'dappSign' | 'dappSignMessage'
    | 'send' | 'nftTransfer' | 'receive' | 'linkdropClaim'
    | 'stakeDeposit' | 'stakeManage' /* unstake, withdraw, claim */ | 'lockupTransfer'
    | 'enableTwoFactor' | 'addRecoveryMethod' | 'manageLedger'
    | 'removeFullAccessKey' | 'ledgerMetadataKey';
    // Deliberately NOT capabilities (never gated): migrate, exportKeys, disableTwoFactor,
    // revokeAppKeys, login/import/unlock. Keeping them off this list means they can't be gated by mistake.

const DISABLED_FROM: Record<SunsetCapability, SunsetPhase | null> = {
    createAccount: 2, importNonExistentAccount: 2, swap: 2, buy: 2, dappConnect: 2,
    stakeDeposit: 2, enableTwoFactor: 2,
    explore: 3, dappSign: 3, dappSignMessage: 3, send: 3, nftTransfer: 3, receive: 3,
    linkdropClaim: 3, stakeManage: 3, lockupTransfer: 3 /* D7 */, addRecoveryMethod: 3,
    manageLedger: 3, removeFullAccessKey: 3, ledgerMetadataKey: 3,
};

export const isSunsetCapabilityEnabled = (cap: SunsetCapability, phase = getSunsetPhase()) =>
    DISABLED_FROM[cap] == null || phase < DISABLED_FROM[cap];
```

**Config plumbing** follows the existing pattern in [configFromEnvironment.ts](packages/frontend/src/config/configFromEnvironment.ts) and [environmentDefaults/](packages/frontend/src/config/environmentDefaults):
- [ ] `SUNSET_PHASE`: parsed from env, validated to `1 | 2 | 3`; an invalid value **fails the build**. Defaults live in each `environmentDefaults/*.ts` file (all `1` today) so every phase change is a reviewed git diff. The env var is only for emergency overrides.
- [ ] `SUNSET_PHASE_3_DATE` and `SUNSET_FINAL_DATE` (ISO strings): used **only for copy**, never for gating. Gating by date would change behaviour without a deploy and is hard to test.
- [ ] **QA override:** on non-mainnet builds only (`!CONFIG.IS_MAINNET || CONFIG.IS_DEVELOPMENT`), `?sunset_phase=N` is stored in `sessionStorage` and shown as a small "QA: phase N" chip. It is **ignored on mainnet and mainnet staging**.
- [ ] Register `sunset_phase` as a PostHog super-property (next to the existing `wallet_environment` in [posthog/index.js](packages/frontend/src/posthog/index.js)).

### 5.2 Gating primitives: three required layers and one optional

| Layer | Primitive | Purpose |
| --- | --- | --- |
| 1. Entry points | `useSunsetCapability(cap)` hook | Hide or replace buttons, nav items, banners and CTAs |
| 2. Routes | `<SunsetGatedRoute capability=… guard=… …>` (guard = the route's existing guard component) | Direct URLs and deep links render the **Feature Retired page** instead of the feature |
| 3. Actions | `assertSunsetCapability(cap)` at the top of each thunk or service that starts the action | Catches any entry point we missed. Throws `SunsetCapabilityError`, which the UI shows as the retired message rather than a generic error |
| 4. Transactions (Phase 3, recommended) | Transaction-shape allowlist in the lockup decorator | Last line of defence; see §7.8 |

`SunsetGatedRoute` notes:
- React-router v5 `<Switch>` matches on child `path`/`exact` props, so a wrapper component works in place.
- When the capability is disabled it renders a plain `<Route>`. It must **not** render the original guard: `PasswordProtectedRoute` would show `SetPasswordPage` or the unlock screen first, and `PrivateRoute` would bounce guests to `/`.
- The dApp variant (§5.3) must render without auth for the same reason.

**Feature Retired page** (new: `components/sunset/FeatureRetiredPage.jsx`):
- Icon and title: "{Feature} is no longer available in MyNearWallet"
- Body: "MyNearWallet is being retired. {Feature} has been switched off so you can focus on moving your accounts to a supported wallet. Your funds are safe in your account on NEAR." Plus one line specific to the capability, for example "After you migrate, you can swap tokens in Meteor Wallet."
- **Primary:** "Migrate my accounts" (or "Resume account transfer" if a transfer is pending; see §5.4)
- **Secondary:** "Back to wallet"
- **Link:** "Why is this happening?" → sunset page
- Fires `sunset_feature_blocked { capability, entry: 'route' | 'action', path }`. `path` is the route *pattern*, never the raw URL.
- Visual style reuses [AccountExportNotice.jsx](packages/frontend/src/components/account-export/AccountExportNotice.jsx) and the export page containers, so the sunset screens look like one family.

### 5.3 dApp request terminator

**New: `components/sunset/DappRequestRetired.jsx`.** One component for `/login`, `/sign`, `/sign-message` and `/verify-owner` that always sends the dApp a terminal response.

Today's behaviour, from the code survey:
- MNW chooses popup or redirect **only by checking `window.opener`**.
- It never calls `window.close()`, and it has no inbound message listener.
- Every popup reply is a `postMessage` to the callback URL's origin, followed by a 3-second fallback redirect (for extensions that spoof `window.opener`).

| Request | Popup (near-connect `mnw` executor) | Redirect (near-api-js, wallet-selector ≤ 8.x) | No callback |
| --- | --- | --- | --- |
| `/login` | `{status:'failure', errorCode:'USER_CANCELLED', errorMessage}` → `failure_url` origin | `failure_url` (validated with the existing blocked-protocol check in [helper-api.ts](packages/frontend/src/utils/helper-api.ts)) | CLI: show "Use another wallet for `near login`" instructions. Nothing to redirect to. |
| `/sign` | `{status:'failure', signMeta, errorCode:'userRejected', errorMessage}` | `callbackUrl?signMeta&errorCode=userRejected&errorMessage=…` (encode **once**; see Appendix A) | Back to wallet |
| `/sign-message` | `{status:'failure', errorMessage}` (**not** `'success'`; today's reject path sends `success`, see Appendix A) | `callbackUrl#error=…` (existing format) | Back to wallet |
| `/verify-owner` | n/a (no popup support) | `callbackUrl?meta&error=…` | Back to wallet |

UX:
- **Title:** "MyNearWallet can't connect to apps anymore" (Phase 2, `/login`) or "MyNearWallet can no longer approve app requests" (Phase 3).
- **Body:** names the requesting host (`new URL(callback).host`): "**{host}** asked to connect. MyNearWallet is being retired and no longer accepts new app connections. Choose another wallet in {host}, or move your account to Meteor Wallet first."
- **Primary:** "Return to {host}". It sends the failure response, with the same 3-second fallback redirect as today.
- **Secondary:** "Migrate my accounts", which opens in a new tab when in popup mode so the dApp's popup channel isn't lost.
- **No automatic redirect.** Users need to read why. If they close the popup, near-connect already rejects with "User closed the window".

Implementation notes:
- [ ] **Pull out shared failure helpers** (`sendLoginFailure`, `sendSignFailure`, `sendSignMessageFailure`) from [SelectAccountLoginWrapper.js](packages/frontend/src/components/login/v2/SelectAccountLoginWrapper.js), [SignWrapper.js](packages/frontend/src/routes/SignWrapper.js) and [SignMessageWrapper.js](packages/frontend/src/routes/SignMessageWrapper.js). The terminator and the existing cancel buttons then use one code path.
- [ ] **Render before every auth/unlock guard.** `/login` and `/sign` are `PrivateRoute`s, so a logged-out user is bounced to guest landing today, and the unlock page has no cancel. Both are dApp dead-ends.
- [ ] **Cover both URL forms.** `/login` is not `exact`, so `/login/` (the near-api-js form) must also be gated.
- [ ] **Skip login URL processing when `dappConnect` is disabled.** In [redux/actions/account.js](packages/frontend/src/redux/actions/account.js), `handleRefreshUrl` runs `checkContractId` (an RPC call) and can redirect to `/login/?invalidContractId=…`; skip that.
- [ ] Suppress `SunsetNotice` and the global sunset bar (§6.7) on dApp routes, because they can appear inside popups today.
- [ ] Fire `sunset_dapp_request_rejected { kind, mode: 'popup' | 'redirect' | 'none', host }`. The host only, never the path or query.

### 5.4 Migration entry and per-account status

- [ ] **`useMigrationEntryRoute()`**: pull the resume logic out of [AccountExportBanner.jsx](packages/frontend/src/components/wallet/AccountExportBanner.jsx) (journal sessions → resume stage). Every "Migrate" CTA in the app then goes to the right place: start, or resume at activation or verification.
- [ ] **`useMigrationStatus()`** gives each account's status, combining:
  - **Meteor journal** (`getMeteorNewKeyTransferSessions` + `summarizeNewKeyTransferSession`): `in_progress` / `secured`.
  - **New local marker** `mnw:sunset:exported` = `{ [accountId]: { method: 'manual', at } }`, written when a private key is revealed or copied. It **never** stores key material. It yields `key_exported`, which is unverified and must be labelled differently from `secured`.
  - **Eligibility**: `loadExportableAccounts()`, but **only on the home screen, Migration Hub and export screens**, with results cached in memory for the session. The probe makes several RPC reads per account and the code already notes rate-limit problems.
- [ ] **Status labels:** "Not moved yet" · "Transfer in progress" · "Secured in Meteor ✓" · "Key exported (not verified)" · "Needs action: {reason}".

### 5.5 Copy and translations

- [ ] New `sunset.*` namespace in all 9 locales (`en, it, pt, ru, tr, ua, vi, zh-hans, zh-hant`), using `react-i18next` like the export flow.
- [ ] Move `SunsetNotice` from hard-coded English onto translation keys, with per-phase variants.
- [ ] Extend the parity check in [newKeyTransferLocaleParity.test.js](packages/frontend/src/translations/newKeyTransferLocaleParity.test.js) to cover `sunset.*`. The existing [translations.test.ts](packages/frontend/test/translations.test.ts) link rule also applies.
- [ ] **Use one date source.** Dates come only from `SUNSET_PHASE_3_DATE` / `SUNSET_FINAL_DATE`, formatted for the locale with the existing `formatTimestampForLocale`.
- [ ] **Anti-phishing line** in the notice, the bar and the support macros: "We will never ask for your recovery phrase or private key by email, DM or on any other website. Migration only happens inside app.mynearwallet.com." A sunset is a gift to phishers.
- [ ] **Terminology:** always "private key (starts with `ed25519:`)" and "12-word recovery phrase", never just "password" or "secret". The [implicit-account support ticket](docs/user-issue/implicit-account-migration-passphrase-ticket-response.md) shows users already confuse migration passphrases with keys.

### 5.6 Analytics and monitoring

Existing infrastructure: PostHog (sanitised, no autocapture), Mixpanel, and the Sentry DSN in config.

| Event | Properties | Used for |
| --- | --- | --- |
| `sunset_feature_blocked` | capability, entry (`route` / `action` / `button`), route pattern | Finding missed entry points and sizing support load |
| `sunset_retired_cta_clicked` | capability, cta (`migrate` / `back` / `learn_more`) | Whether retired pages turn into migrations |
| `sunset_dapp_request_rejected` | kind, mode, host | Which dApps still send users to MNW; feeds the outreach list (§6.10) |
| `sunset_notice_shown` / `_cta_clicked` | phase, variant | Notice fatigue versus conversion |
| `sunset_bar_cta_clicked` | phase, migrated / total counts | |
| `sunset_ineligible_guidance_clicked` | availability reason, action | Which blocked account types need more help |
| `sunset_import_nonexistent_blocked` | method (`phrase` / `key` / `ledger` / `link`) | D10 impact |

- [ ] **PostHog dashboard:** migration funnel broken down by `sunset_phase`, share of weekly-active accounts with status `secured`, blocked-feature hits by capability, and dApp rejections by host.
- [ ] **Sentry alert** on any `SunsetCapabilityError` thrown from the *action* layer. Each one means a UI entry point we missed.

---

## 6. Phase 2: Migration-Focused Experience

**Outcome:** existing users can view, send, receive, unstake and migrate. New account creation, swaps, buying, new staking and new dApp connections are retired and redirect into migration. Migration prompts appear throughout the wallet.

### 6.1 Disable new account creation

**Background:** `DISABLE_CREATE_ACCOUNT` is checked in one place only, `/create` at [App.js](packages/frontend/src/app/App.js) (~L433), and only for logged-out users. On mainnet today:
- Logged-in users can still create named accounts (`/fund-with-existing-account` → `create_account` with a deposit).
- Linkdrop "Claim with New Account" creates on-chain named accounts (`create_account_and_claim`).
- Guests are routed into the implicit-account creation flow.

The flag is therefore **not** a usable gate. Replace its check with the `createAccount` capability, and keep the flag only as a legacy alias that can make gating stricter but never looser.

#### 6.1.1 Routes → `SunsetGatedRoute capability='createAccount'`
- [ ] `/create`; also delete the dead duplicate `/create` route.
- [ ] `/create/:fundingContract/:fundingKey`, `/create-from/:fundingAccountId`
- [ ] `/set-recovery-implicit-account`, `/setup-passphrase-new-account`, `/create-implicit-account`
- [ ] `/setup-ledger-new-account`. Keep its existing branch that **redirects to `/sign-in-ledger` when the Ledger's implicit account already exists**; retire only the creation branch.
- [ ] `/verify-account`, `/fund-with-existing-account`, `/fund-create-account/:accountId/:implicitAccountId/:recoveryMethod`, `/enable-two-factor` (the last under `enableTwoFactor`)
- [ ] **`/initial-deposit` and `/create-implicit-account` need special handling: don't strand someone mid-creation.** If the user's implicit account **already exists on-chain** (they funded it before Phase 2 shipped), skip the named-account claim step: activate the implicit account as a normal account and go home, with the notice "Account creation has ended. Your funded account {implicitId} is ready, and you can migrate it now." Show the Feature Retired page only if it isn't funded.

#### 6.1.2 Shared routes that also serve existing accounts
`/set-recovery/:accountId`, `/setup-seed-phrase/:accountId/:step` and `/setup-ledger/:accountId` decide "new vs existing" by calling `checkIsNew(accountId)` on-chain, not by route.
- [ ] Show Feature Retired when `createAccount` is disabled **and** any of these holds: `checkIsNew` is true, `fundingOptions` is present, or it's a trial drop.
- [ ] **Fail closed.** If `checkIsNew` errors (network or RPC), show a retry message. Never fall through to creation.
- [ ] Existing-account uses keep working in Phase 2: Profile "enable seed phrase", Full Access Keys "add key" (`?addKey=true`), and Hardware Devices "enable Ledger".

#### 6.1.3 Entry points → hidden or replaced (`useSunsetCapability('createAccount')`)

| Location | Change |
| --- | --- |
| [GuestLanding.js](packages/frontend/src/components/landing/GuestLanding.js) "Create Account" (primary) | Make **"Import existing account"** the primary CTA. Add a notice: "MyNearWallet no longer creates new accounts. New to NEAR? Get Meteor Wallet" (external link). Keep the `homePageImportAccountButton` test id. |
| [CreateAccountLanding.js](packages/frontend/src/components/accounts/create/landing/CreateAccountLanding.js) "Get Started" | Unreachable once `/create` is gated. Delete in Phase 3 cleanup. |
| [CreateAccountBtn.js](packages/frontend/src/components/navigation/CreateAccountBtn.js), used in `DesktopMenu.js` and `MobileContainer.js` | Hide |
| [CreateCustomNameLightBanner.js](packages/frontend/src/components/wallet/CreateCustomNameLightBanner.js) (home sidebar) | Hide |
| [CreateCustomNameModal.js](packages/frontend/src/components/wallet/CreateCustomNameModal.js) (opened from `Wallet.js`) | Suppress |
| [AutoImport.js](packages/frontend/src/components/accounts/auto_import/AutoImport.js) failure "Create New Account" | Replace with "Try another import method" → `/recover-account` |
| [NearDropLanding.js](packages/frontend/src/components/accounts/linkdrops/NearDropLanding.js) "Claim with New Account" | Hide. Keep "Claim with Existing Account" and "Log In and Claim". |
| [TrialDropLanding.js](packages/frontend/src/components/accounts/linkdrops/TrialDropLanding.js) "Secure Account" | Retire. It reuses the creation path through `create_account_and_claim`. |
| `CreateAccount.js` "Reserve my account ID" | Unreachable once gated |

#### 6.1.4 Stop imports from quietly creating accounts (D10)
Every import path falls back to `wallet.importZeroBalanceAccount` when the derived account isn't on-chain. Entering any fresh seed phrase, key or Ledger therefore adds a brand-new implicit account. Affected paths:
- [RecoverAccountSeedPhrase.js](packages/frontend/src/components/accounts/RecoverAccountSeedPhrase.js)
- [RecoverAccountPrivateKey.js](packages/frontend/src/components/accounts/RecoverAccountPrivateKey.js)
- [SignInLedgerWrapper.js](packages/frontend/src/components/accounts/ledger/SignInLedgerWrapper.js)
- [ImportAccountWithLinkWrapper.js](packages/frontend/src/routes/ImportAccountWithLinkWrapper.js)
- [importAccountThunks.js](packages/frontend/src/redux/slices/importZeroBalanceAccount/importAccountThunks.js)

Changes:
- [ ] With `importNonExistentAccount` disabled, show: "**No NEAR account was found for this recovery phrase.** MyNearWallet can no longer create new accounts. If you expected an account here, check that you entered the phrase correctly. Your phrase also works in Meteor Wallet and other NEAR wallets."
- [ ] **Only block on a definite `AccountDoesNotExist`** for the derived implicit ID, and only when the indexer lookup for named accounts *succeeded* with zero results. If the indexer or RPC fails, show a retry error. Never tell a user "no account" because of an outage. Reuse `isAccountDoesNotExistError` from [accountExportAccounts.js](packages/frontend/src/components/account-export/accountExportAccounts.js).

#### 6.1.5 Action-layer asserts (`assertSunsetCapability('createAccount')`)
- [ ] [createAccountThunks.js](packages/frontend/src/redux/slices/account/createAccountThunks.js): `createNewAccount`, `createIdentityFundedAccount`, `createAccountFromImplicit`*, `createAccountWithSeedPhrase`, `createNewAccountWithCurrentActiveAccount`, `initiateSetupForZeroBalanceAccountPhrase`, `initiateSetupForZeroBalanceAccountLedger`
- [ ] [redux/actions/account.js](packages/frontend/src/redux/actions/account.js): `fundCreateAccount`, `fundCreateAccountLedger`, the creation branch of `handleCreateAccountWithSeedPhrase`
- [ ] `wallet.createNewAccountLinkdrop`

*Except the "already funded implicit" completion in §6.1.1.

#### 6.1.6 Tidy-up
- [ ] `WALLET_CREATE_NEW_ACCOUNT_FLOW_URLS` also lists recovery pages and is substring-matched in four places. Leave it as is in Phase 2, because changing it affects `refreshAccount` and `flowLimitation` across recovery. Note it for Phase 4 cleanup.

### 6.2 Disable swaps
- [ ] `/swap` → `SunsetGatedRoute capability='swap'`. Retired-page line: "Swap tokens in Meteor Wallet after you migrate."
- [ ] Hide the Swap action button in [Wallet.js](packages/frontend/src/components/wallet/Wallet.js) (home action row).
- [ ] Assert in `utils/hooks/useSwap.js` and `services/tokenExchange/FungibleTokenExchange.js`, which also covers the NEAR↔wNEAR path that bypasses the transaction executor.
- [ ] Stop the swap-data prefetch (`swapActions.fetchSwapData`) when swap is disabled, to save Ref Finance API calls.

### 6.3 Disable buy / on-ramp (D3); Explore
- [ ] `/buy` → gated (`buy`). Hide **Top Up** on the home screen, [DepositNearBanner.js](packages/frontend/src/components/wallet/DepositNearBanner.js), and the buy link in [explore/components/Banner.js](packages/frontend/src/components/explore/components/Banner.js).
- [ ] Stop the MoonPay API and helper `/moonpay/signURL` calls that run when [BuyNear.js](packages/frontend/src/components/buy/BuyNear.js) loads.
- [ ] Explore stays reachable by URL in Phase 2. Its **nav slot** in [NavLinks.js](packages/frontend/src/components/navigation/NavLinks.js) becomes **"Migrate"** (→ `useMigrationEntryRoute()`), with an attention dot until all accounts are secured.

### 6.4 Disable new dApp connections

**Background:**
- MNW has no record of connected dApps. A "connection" is just the dApp holding the account ID, plus an optional on-chain function-call key that `/login` adds.
- Existing function-call keys sign zero-deposit calls **locally in the dApp, without MNW**, so they keep working whatever we do.
- `/sign` never checks for a prior login. Hence D4.

Tasks:
- [ ] `/login` (and `/login/`) → `DappRequestRetired kind='login'` (§5.3), for logged-in, logged-out and locked users alike.
- [ ] **Resumed logins hit the same terminator.** After import or recovery, `redirectToApp()` and `finishAccountSetup` may resume a saved `redirect_url=/login?…`. That must reach the terminator, which it will once the route itself is gated.
- [ ] **CLI login** (`/login?public_key&success_url=http://127.0.0.1:…`, no `contract_id`, so a full-access key) gets the terminator with no-callback copy: "`near login` with MyNearWallet is no longer supported. Import your account into near-cli with your private key, or use another wallet." The CLI's local server times out by itself.
- [ ] Assert `dappConnect` in `allowLogin` (redux/actions/account.js).
- [ ] **`/sign`, `/sign-message`, `/verify-owner` stay open (D4)**, with an `AccountExportNotice` (variant `info`) above the request: "MyNearWallet is being retired. App approvals end on {phase3Date}. Move your account to keep using {host}." This notice must not move or overlap the approve and reject buttons.
- [ ] **Login cancel already works for Phase 2.** On the account-select step, "Cancel" already sends `USER_CANCELLED`. The second-step Cancel doesn't notify the dApp, but `/login` is gated before that step in Phase 2, so no fix is needed.

### 6.5 Staking: unstake-only (D2)
- [ ] **Native staking** ([StakingContainer.js](packages/frontend/src/components/staking/StakingContainer.js), [redux/actions/staking.js](packages/frontend/src/redux/actions/staking.js)):
  - Hide the stake buttons in `Staking.js`, `Validators.js`, `ValidatorBox.js` and `Validator.js`.
  - Gate the deep links `/staking/:validator/stake`.
  - Assert in `handleStakingAction` when the action is `stake` (including lockup `select_staking_pool` + `deposit_and_stake`).
- [ ] **Liquid staking** ([liquid-staking/](packages/frontend/src/components/staking/liquid-staking)):
  - Hide the stake entry points in `ValidatorBoxItem.tsx`, `ValidatorDetail.tsx` and `StakingForm.tsx`.
  - Assert in `liquidStaking` ([redux/actions/liquidStaking.ts](packages/frontend/src/redux/actions/liquidStaking.ts)).
  - Instant unstake, delayed unstake and withdraw stay.
- [ ] **Unstake, withdraw and claim farm rewards stay available.**
- [ ] **Fix while here:** withdrawing on a farming validator auto-claims rewards first, but [Validator.js](packages/frontend/src/components/staking/components/Validator.js) does `Promise.all([[...]])`, so the claims aren't awaited. Withdraw is one of the few staking actions left, so make it reliable.
- [ ] Staking page banner: "Staking new funds has ended. Your staked NEAR stays in your account and can be managed from your new wallet. Unstaking takes about 2–3 days, so you can start now or after you migrate."

### 6.6 Account security actions
- [ ] Retire **Enable 2FA**: `/enable-two-factor` and the Profile 2FA enable entry. Assert in `deployMultisig`. Enabling 2FA now would block the user's own migration.
- [ ] **Replace "Disable 2FA" with the helper-free flow** in §6.6.1, and put it in the migration flow (§6.8), not only in [TwoFactorAuth.js](packages/frontend/src/components/profile/two_factor/TwoFactorAuth.js) under Profile.
- [ ] **Make the bricked-2FA recovery reachable and helper-free.** [AccountLock.jsx](packages/frontend/src/components/wallet-migration/AccountLock.jsx) (seed phrase → `TwoFactor.disableMultisigWithFAK`) is dead code today. Mount it from the 2FA guidance step when `isAccountBricked()` is true.
  - Bricked contract state makes `add_request_and_confirm` fail, so these accounts still need a full-access seed phrase.
  - Replace `disableWithFAK`'s helper lookup (`/2fa/getAccessKey`) with the on-chain lookup described in §6.6.1.
- [ ] Seed-phrase recovery, Ledger enable/disable and key revocation: unchanged in Phase 2 (D12, D8).

#### 6.6.1 Turning off 2FA without NEAR's 2FA service

**How the [2fa-recovery](https://github.com/Meteor-Wallet/2fa-recovery) app works:**
- The legacy multisig contract needs 2 confirmations, counted by **signing public key**. Normally the second one comes from NEAR's helper after an SMS or email code.
- The contract's `confirm` only checks that the call comes from the account itself. When `confirm` is wrapped in a NEP-366 meta-transaction and submitted by a relayer:
  - the call comes from the user's account, so that check passes;
  - the signing key is the relayer's, so it counts as a second, different key.
- So the user's own key plus any relayer satisfy 2-of-2 with no code. The app uses this to add a new full-access key, and Meteor's backend relays the `confirm`.

**Who it covers:**
- It supports code hash `55E7imniT2uuYrECn17qJAk9fLcwQW4ftNSwmCJL5Di` with 2 confirmations. That is **exactly the contract MNW deploys** ([src/wasm/multisig.wasm](packages/frontend/src/wasm/multisig.wasm), unchanged since 2021), so every account that turned on 2FA through MNW qualifies.
- The four older hashes in `MULTISIG_CONTRACT_HASHES` are not covered.

**Security consequence:** on these accounts, any one of the 4-method 2FA keys can take full control of the account. This is true with any relayer, not only Meteor's. Treat exported 2FA keys and old email/SMS recovery phrases as full-control secrets. The old keys must be removed once the account is in the new wallet.

Tasks:
- [ ] **"Turn off 2FA" step for `two_factor_unsupported` accounts on the supported contract.** It uses the local key MNW already holds and never shows it to the user.
  1. **Preflight.** Same checks as the app's [preflight.ts](https://github.com/Meteor-Wallet/2fa-recovery/blob/main/apps/web/src/preflight.ts): code hash, `get_num_confirmations == 2`, local key has the 4 multisig methods and allowance left, and enough balance for one ~100 Tgas call plus request storage.
  2. **Build the request.** It is the same request MNW's `disable()` builds today: state cleanup if needed, delete the confirm-only key, convert the 4-method keys back to full access, deploy `main.wasm`. The one change: find the confirm-only key on-chain (the account's function-call key limited to `['confirm']`) instead of asking the helper's `/2fa/getAccessKey`.
  3. **Submit and confirm.**
     - Submit the request with `add_request_and_confirm`.
     - Sign a `confirm` meta-transaction, with gas sized for the cleanup; test 300 Tgas.
     - Post it to the Meteor relay.
     - Poll until the account's code hash is `main.wasm` (`E8jZ1giWcVrps8PcV75ATauu6gFRkcwjNtKp7NKmipZG`) and the local key has full access.
  4. **Result.** It is now a normal account and MNW's own key has full access again. It shows as `available` and goes through the normal Meteor transfer. There is no code to enter, no new phrase to save, and no NEAR helper involved.
  - Copy the app's protection against ambiguous submissions: never resubmit `add_request_and_confirm` blindly; reconcile from `list_request_ids` / `get_request`.
- [ ] **Fallback if the combined request fails on testnet** (for example, not enough gas for state cleanup under one relayed `confirm`):
  - Do what the app does: a single-AddKey request for a new key that MNW generates and stores in its keystore.
  - Change eligibility so an account whose local key has full access can be transferred even with the contract still deployed. Check first that Meteor handles accounts that still have the multisig contract.
- [ ] **Unsupported contract versions** (older hash, or a threshold other than 2): offer manual export and the support macro. Don't show a button that will fail.
- [ ] **Link the standalone app** from the sunset page, FAQ and support macros. It is the path for anyone who no longer has MNW but holds a 2FA key or an old email/SMS recovery phrase, including after Phase 4. Host it on a recognisable Meteor or MNW domain, not a bare `github.io` URL.
- [ ] **Blocked until the relay hardening in §4 ships.**

### 6.7 Migration prompts throughout the wallet

The POA says "migration prompts appear throughout the wallet experience". Use a consistent hierarchy, so prompts are persistent but not hostile:

| Surface | Phase 2 behaviour |
| --- | --- |
| **Global sunset bar** (new; under the nav on every logged-in page **except** `/export-accounts/*`, dApp routes and the unlock page) | Compact and **not dismissible**: "MyNearWallet is closing. Sending and staking end on **{phase3Date}**. **{n} of {total}** accounts moved. [Migrate now]". Once every account is `secured`: "All accounts moved ✓. You can remove them from this browser. [Review]" |
| **Home hero banner** ([AccountExportBanner.jsx](packages/frontend/src/components/wallet/AccountExportBanner.jsx)) | Keep it as the main home CTA. Add the per-account progress, and the phase 3 date once known. |
| **Sunset modal** ([SunsetNotice.tsx](packages/frontend/src/app/SunsetNotice.tsx)) | Translated phase 2 copy listing what was switched off and what's next. Cadence goes from 4 days to **once per day**. Primary button "Migrate now" (not just "Continue"). Never shown on dApp or export routes. |
| **Contextual nudges** | Send success: "Sent. Next: move this account to Meteor." Receive page: "Planning to receive funds long-term? Migrate first: your address stays the same." Staking: the §6.5 banner. Profile: a new **"Migration"** card with per-account status. |
| **Account switcher** (`DesktopMenu.js`, `MobileContainer.js`) | A status chip per account ("Secured ✓", "Not moved", "Needs action") |
| **Nav** | "Migrate" item (§6.3) |

- [ ] Don't stack prompts. On the home screen, show either the bar or the hero banner, not both, so the hero banner wins there.
- [ ] Respect `prefers-reduced-motion` (the Meteor card animations already do).
- [ ] Mobile layout: 16px gutters. The bar wraps to two lines, with the CTA on its own line under 600px, matching the existing banner breakpoints.

### 6.8 Close the eligibility gaps in the migration flow

Today, accounts that aren't `available` get a reason and nothing else. Give each reason a next step on [AccountExportSelect.jsx](packages/frontend/src/components/account-export/AccountExportSelect.jsx) / [AccountExportAccountList.jsx](packages/frontend/src/components/account-export/AccountExportAccountList.jsx):

| `availability` | What we tell the user | Action |
| --- | --- | --- |
| `two_factor_unsupported` | "This account has 2FA turned on. MyNearWallet can turn it off for you; it takes about a minute and no code is needed." | **"Turn off 2FA"** → helper-free flow (§6.6.1), then return to selection. Bricked → AccountLock seed-phrase path. Unsupported contract → manual export and support. |
| `ledger_unsupported` | "This account is secured by your Ledger device. You don't need to move a key: connect the same Ledger in Meteor Wallet (or any Ledger-compatible NEAR wallet)." | "How to use my Ledger in Meteor" guide link. Mark it as done once the user confirms. |
| `not_funded` | "This address has never received funds, so it doesn't exist on NEAR yet. Its key still controls it if funds arrive later." | **"Export key"** (manual export allowed; §6.8.1) |
| `no_local_key` | "MyNearWallet doesn't hold a key for this account in this browser (for example, it was added with a Ledger or on another device). Use the original recovery phrase or device in your new wallet." | Link to the "other wallets" guide |
| `not_full_access` | "This browser's key for this account can't control it fully, so it can't be transferred from here. Use your original recovery phrase in your new wallet." | Guide link |
| `algorithm_unsupported` | "This key type isn't supported for transfer. Export it manually and import it into a wallet that supports it." | Export key |
| `verification_failed` | Existing copy (temporary network issue) | **"Retry"** button, which re-probes that one account |

#### 6.8.1 Manual export for every local key
- [ ] [AccountExportManual.jsx](packages/frontend/src/components/account-export/AccountExportManual.jsx) and `loadExportAccountSecrets` accept any keystore account with a local key, not just `available` ones. Show warnings specific to each reason. For 2FA: "This key can take full control of this account. Keep it as safe as a recovery phrase." (see §6.6.1)
- [ ] Add a **"Export keys" secondary entry** on the selection screen so users can reach manual export without picking the Meteor path first.
- [ ] **Label keys clearly:** "Private key (starts with `ed25519:`). In your new wallet, choose *Import private key*." Add: "If you saved a 12-word recovery phrase when you created this account, that phrase still works too."
- [ ] Write the `mnw:sunset:exported` marker (§5.4) when a key is revealed or copied.

#### 6.8.2 Check balances after migration (POA step 3, "confirming balances and staking visibility")
- [ ] On [AccountExportNewKeyActivated.jsx](packages/frontend/src/components/account-export/AccountExportNewKeyActivated.jsx) (complete state), add a **"What you should see in Meteor"** checklist per account: available NEAR, staked total (native + liquid), lockup balance (if any), token count and NFT count. The user can then confirm parity before removing anything.
- [ ] The removal step ([AccountExportRemove.jsx](packages/frontend/src/components/account-export/AccountExportRemove.jsx)) stays opt-in and local-only. Copy should repeat that this does **not** touch the on-chain account.

### 6.9 Advance notice of Phase 3
- [ ] Once `SUNSET_PHASE_3_DATE` is set, the bar, modal, sign-screen notice and staking banner all show the date and say exactly what stops: sending, staking actions, app approvals, receiving through MNW.
- [ ] From **7 days before**, the modal shows a stronger "N days left" variant.
- [ ] Ship with Phase 2 so the 14-day notice period (D1) starts on release day.

### 6.10 External coordination (start now; these have lead times)
- [ ] **near-connect manifest**: the `mynearwallet` entry in `hot-dao/near-selector` `repository/manifest.json` still declares `signIn`, `signInWithoutAddKey`, `signInAndSignMessage` and `signInWithFunctionCallKey`. In Phase 2, PR the removal of the sign-in features, or a deprecated flag if the schema supports one. In Phase 3, PR removal of the entry.
- [ ] **wallet-selector** (`@near-wallet-selector/my-near-wallet`): ask NEAR to mark the module deprecated and drop it from default wallet lists.
- [ ] **dApp developer announcement** (NEAR DevRel channels): dates, the fact that requests will be rejected (not hang), and the error codes (D5). Use `sunset_dapp_request_rejected` hosts for targeted follow-up.
- [ ] **near-cli docs**: change `near login` guidance away from MNW.
- [ ] **Sunset page** (`mynearwallet.com/sunset`, linked from the modal): add a phase timeline, FAQ (Ledger, 2FA, lockup, staking, "my key vs my phrase", "I forgot my MNW password"), the other-wallets list (D11) and the anti-phishing notice.
- [ ] **Support macros (Gleap):** one per ineligibility reason, plus 2FA locked out, forgotten MNW password (only the original recovery phrase can restore access), migration-passphrase confusion, and "funds sent after Phase 3".

### 6.11 Phase 2 release checklist
- [ ] Every row of the Phase 2 column in §3 is covered by layers 1–3 (§5.2), and §8's route-gating test passes for every retired route.
- [ ] The e2e suite is updated (§8.2) and green on testnet.
- [ ] The manual QA matrix (§8.3) has passed on **testnet** and **mainnet staging** with real small accounts.
- [ ] Translations complete in all 9 locales; the parity test is green.
- [ ] PostHog dashboard and Sentry alert are live.
- [ ] The sunset page, support macros and dApp announcement are published, timed to the release.
- [ ] Roll out: `SUNSET_PHASE=2` in `testnet.ts` → `staging` → `mainnet_STAGING.ts` → `mainnet.ts` (merge to the `mainnet` branch deploys through Cloudflare Pages).

---

## 7. Phase 3: Limited Functionality Mode

**Outcome:** users can log in, view balances (including staking and lockup), export credentials and complete migration. Sending, receiving through MNW, staking actions, swaps, all dApp requests and most account management are retired, and each redirects into migration or recovery.

### 7.1 Flip the Phase 3 capabilities
| Capability | Changes |
| --- | --- |
| `send` | Gate `/send-money/:accountId?`. Hide Send on the home screen and in `send/components/TabSelector.js`. Assert in `fungibleTokensService.transfer` ([FungibleTokens.js](packages/frontend/src/services/FungibleTokens.js)). The unused redux `sendMoney` can be deleted. |
| `nftTransfer` | Hide the Transfer button in [NFTDetail.js](packages/frontend/src/components/nft/NFTDetail.js); NFT detail stays viewable. Assert in `NonFungibleTokens.transfer`. |
| `receive` (D6) | Gate `/receive-money` with copy: "Receiving through MyNearWallet has ended. Your account still exists on NEAR, so anything sent to it arrives on-chain and is available in whichever wallet you move to." Keep the account ID copy control on the home screen and profile. |
| `linkdropClaim` (D9) | `/linkdrop/...` shows "Claim this link with Meteor Wallet or another NEAR wallet". Assert in `claimLinkdropToAccount`. |
| `stakeManage` | See §7.5 |
| `lockupTransfer` (D7) | Hide [LockupAvailTransfer.js](packages/frontend/src/components/profile/balances/LockupAvailTransfer.js), or keep it as an allowed action depending on D7 |
| `explore` | Gate `/explore`. Remove the Explore banner from the home screen. |
| `addRecoveryMethod`, `manageLedger`, `removeFullAccessKey` (D8) | Hide the relevant actions in [Recovery/index.js](packages/frontend/src/components/profile/Recovery/index.js), [HardwareDevices/index.js](packages/frontend/src/components/profile/HardwareDevices/index.js), [FullAccessKeys.js](packages/frontend/src/components/access-keys/v2/FullAccessKeys.js) and `FullAccessKeyRotation.js`. Gate `/set-recovery/*`, `/setup-seed-phrase/*`, `/setup-ledger/*` and `/setup-ledger-success` (the last deletes keys on-chain). `/full-access-keys` stays viewable. |
| `ledgerMetadataKey` | Make `addWalletMetadataAccessKeyIfNeeded` (`utils/wallet.ts`) a no-op, so Ledger sign-in sends nothing on-chain. Verify that Ledger sign-in still lists accounts without it. |

**Stays open in Phase 3:** disable 2FA (including AccountLock), revoking authorized-app keys ([AuthorizedAppsKeys.js](packages/frontend/src/components/access-keys/v2/AuthorizedAppsKeys.js)), password management, and `/batch-import` and `/auto-import-*` (import only, with the zero-balance fallback still blocked). `/batch-import` is also a recovery route for old wallet-selector exports; see the [support ticket](docs/user-issue/implicit-account-migration-passphrase-ticket-response.md).

### 7.2 Block all dApp requests
- [ ] `/sign`, `/sign-message`, `/verify-owner` → `DappRequestRetired` (§5.3), with the Phase 3 copy.
- [ ] Assert `dappSign` in `handleSignTransactions` ([redux/slices/sign](packages/frontend/src/redux/slices/sign)), including the private-shard (Calimero) branch, and `dappSignMessage` in the sign-message and verify-owner thunks.
- [ ] Offer **"Review app connections"** (→ `/authorized-apps`) on the Migration Hub. Existing dApp function-call keys keep signing locally until revoked. That isn't dangerous (zero-deposit calls with limited allowances), but users should know about it.
- [ ] Phase 3 PR to the near-connect manifest: remove the entry (§6.10).

### 7.3 Navigation in Phase 3
| Nav item | Phase 3 |
| --- | --- |
| Wallet | → Migration Hub (§7.4) |
| Migrate | → `useMigrationEntryRoute()` |
| Staking | → read-only Staking Overview (§7.5) |
| Account (`/profile`) | Read-only details, export key, disable 2FA, app connections, password |
| Support (Gleap) | unchanged |
| Explore | removed |

Account switcher: "Import account" stays; "Create account" stays hidden. Show the per-account status chips.

### 7.4 Migration Hub (home in Phase 3)

Replace the top of [Wallet.js](packages/frontend/src/components/wallet/Wallet.js), meaning the action row (Send / Receive / Top Up / Swap) and the deposit banners, with a **Migration Hub**:

```
┌──────────────────────────────────────────────────────────────┐
│ MyNearWallet is in limited mode                              │
│ You can view balances, export your keys and move your        │
│ accounts. Sending, staking and app approvals have ended.     │
│                                    [Migrate to Meteor  →]    │
│                                   Export keys · Other wallets│
├──────────────────────────────────────────────────────────────┤
│ alice.near        12.40 NEAR · 50 staked   Secured ✓  [Remove]│
│ bob.near           3.10 NEAR               Not moved  [Move]  │
│ 9f2c…e41a          0 NEAR                  Needs action: 2FA  │
│                                             [Turn off 2FA]    │
└──────────────────────────────────────────────────────────────┘
  Balances | Collectibles  (read-only, unchanged)     Activity
```

- [ ] **One row per keystore account:** status from `useMigrationStatus()`, available, staked and lockup totals, and one context action (Move / Export key / Turn off 2FA / Ledger guide / Remove from this browser).
- [ ] **When everything is secured:** "All your accounts are in Meteor ✓. You can remove them from this browser." This links to the existing removal flow.
- [ ] **Balance views stay as they are, minus actions.** The balances, collectibles and activity tabs keep working read-only. `TokenBox` rows are already non-actionable.
- [ ] Remove `DepositNearBanner`, `ExploreNativeBanner`, `CreateCustomNameLightBanner` and the custom-name modals.
- [ ] The global sunset bar becomes redundant on the hub; keep it on other pages.
- [ ] **Sunset modal in Phase 3:** shown once per **session** (not per day) with "Limited mode" copy and the final date (Phase 4). Primary CTA: "Migrate now".

### 7.5 Read-only staking and lockup overview
"Confirming balances and staking visibility" is a POA migration step, so staking must stay **visible**.
- [ ] **Read-only staking view.** In Phase 3, `StakingContainer` renders the existing staking overview (total staked, per-validator staked / unstaked-pending / available-to-withdraw, liquid positions from `OwnedValidators.tsx`). All stake, unstake, withdraw and claim buttons are hidden. Deep links (`/staking/:validator/*`, `/liquid-staking/:id/*`) go to the overview.
- [ ] **Explain each position state.** Pending unstakes: "Unstaked NEAR becomes withdrawable after about 4 epochs (2–3 days). Withdraw it from your new wallet." Liquid staking: "Your stNEAR is a token in your account and appears in your new wallet. Manage it at Meta Pool."
- [ ] **Lockup:** the Profile lockup balances stay visible. Transfer follows D7.
- [ ] Assert `stakeManage` in `handleStakingAction`, `claimFarmRewards` (which bypasses the lockup and 2FA wrappers through `getAccountBasic`) and the liquid unstake and withdraw actions.

### 7.6 Export recovery credentials (Phase 3 primary action)
- [ ] Manual export, reachable straight from the Hub ("Export keys"), covers **every account with a local key** (§6.8.1).
- [ ] **Password-protected wallets:** the unlock screen gains a "Forgot password?" explainer. MNW can't reset it; the original recovery phrase works in any wallet. No unlock means no export from this browser.
- [ ] **Optional "confirm you saved it" step** before the per-account "Remove from this browser" after a *manual* export: the user pastes the last 6 characters of the key. This reduces "removed before saving" tickets. It is a check typed by the user; nothing else is stored.
- [ ] **No new encrypted backup file format.** The support ticket shows that password-plus-ciphertext exports produce unrecoverable situations when one half is lost. Plain key copy with clear labelling is safer for this audience.
- [ ] **Profile "Export private key"** ([ExportKeyWrapper.js](packages/frontend/src/components/profile/export_private_key/ExportKeyWrapper.js)) stays, as a per-active-account shortcut.

### 7.7 Import and recovery in Phase 3
- [ ] `/recover-account`, `/recover-seed-phrase`, `/recover-private-key`, `/sign-in-ledger`, `/recover-with-link`, `/auto-import-*` and `/batch-import` stay open, because users who cleared their browser need a way back in to migrate.
- [ ] Add an info notice: "You don't need MyNearWallet to get into your account. Your recovery phrase or private key works directly in Meteor Wallet. [Import into Meteor instead]". Import into MNW remains possible underneath.
- [ ] Guest landing becomes: "MyNearWallet is in limited mode" + "Import existing account" + "Get Meteor Wallet".

### 7.8 Transaction-shape guard (defence in depth, recommended)

There is **no single signing chokepoint**:
- `TransactionExecutor` only covers liquid staking and Ref swaps.
- Farm claims, `deployMultisig`, linkdrop `FundingAccount`, `disableMultisigWithFAK` and the Meteor flows all bypass the app-level wrappers.

The broadest app-level point is the **lockup decorator's** `signAndSendTransaction` ([account-with-lockup.ts](packages/frontend/src/utils/account-with-lockup.ts)), applied to everything from `wallet.getAccount()`. That covers send (NEAR, FT, NFT), staking, swaps, dApp `/sign`, liquid staking, and the add/remove-key helpers in `wallet.ts`.

- [ ] Add a pure function `assertSunsetAllowsTransaction({ accountId, receiverId, actions, phase })`. In Phase 3 it allows only:
  1. `DeleteKey` on the user's own account (app-key revocation).
  2. The **2FA-disable shapes**: `delete_request` calls, and `add_request_and_confirm` carrying the disable request (`DeployContract` of main or state-cleanup wasm + `clean` + `DeleteKey` + `AddKey(FAK)`). Match exactly against what §6.6.1 builds. The relayed `confirm` is a meta-transaction signed outside the decorator.
  3. The lockup transfer to the owner, **if** D7 keeps it.
- [ ] Call it at the top of the decorator's `signAndSendTransaction` and in `transactionExecutor.ts`.
- [ ] **Leave the Meteor migration signer alone.** It uses its own one-key `InMemorySigner` and raw `send_tx`, so it is naturally out of scope. Add a test asserting it never goes through the guard.
- [ ] **It must not throw in Phase 2.** The guard is a no-op below Phase 3. Phase 2 sends that trigger the automatic lockup drain (`transferAllFromLockup`) must keep working.
- [ ] Unit-test an allow/deny table (§8.1) and send any denial to Sentry. Each one means a missed UI path.

Skip this if time is short. Layers 1–3 are the required protection; this layer only catches mistakes.

### 7.9 Phase 3 release checklist
- [ ] Every Phase 3 row in §3 is covered by layers 1–3, plus layer 4 if built.
- [ ] D7 and D9 are settled using Meteor's confirmed capabilities.
- [ ] The helper-free 2FA disable (§6.6.1) is validated on testnet against a real MNW-created 2FA account, and the Meteor relay hardening (§4) is live.
- [ ] The 14-day in-app notice has run (§6.9).
- [ ] The near-connect manifest removal PR is open or merged, and the dApp announcement is sent.
- [ ] The QA matrix (§8.3) has passed in Phase 3 on testnet and mainnet staging, **in particular every "must still work" row**.
- [ ] Roll out in the same order as Phase 2.

---

## 8. Cross-cutting test strategy

### 8.1 Unit and integration (jest, `packages/frontend`)
- [ ] **Capability model:**
  - every capability resolves in every phase;
  - **monotonicity**: once disabled, a capability stays disabled in later phases;
  - the never-gated list (migrate, exportKeys, disableTwoFactor, revokeAppKeys, login/import/unlock) is not in the capability type;
  - an invalid `SUNSET_PHASE` fails;
  - the QA override is ignored on mainnet.
- [ ] **Route gating table test:** render `App` routes in a `MemoryRouter` for each phase × each route in Appendix B and assert Feature Retired / terminator / feature. Include `/login/` (trailing slash), locked-wallet and logged-out states for the dApp routes, and confirm the `/export-accounts/*` routes render in **every** phase.
- [ ] **dApp terminator:** the popup `postMessage` payload and target origin for each kind; redirect URL shape with single encoding; the 3-second fallback; the no-callback (CLI) branch; blocked-protocol URLs are refused.
- [ ] **Import-nonexistent blocking:** a definite `AccountDoesNotExist` blocks; an RPC or indexer failure shows retry and never blocks.
- [ ] **Creation-route edge case:** `/initial-deposit` with an already-funded implicit account activates it and does not retire.
- [ ] **Transaction guard (if built):** an allow/deny table covering transfer, FT transfer, stake, unstake, swap, DeleteKey on own account, 2FA disable request set, `delete_request`, AddKey (denied through the decorator) and lockup transfer (per D7). Plus a test that the Meteor AddKey chain does not invoke the guard.
- [ ] **Eligibility guidance:** every `availability` value maps to copy and an action.
- [ ] **Translations:** `sunset.*` parity across all 9 locales.

### 8.2 End-to-end (Playwright, [packages/e2e-tests](packages/e2e-tests))
Make specs phase-aware (read `SUNSET_PHASE` from the test env) rather than deleting them, so they can still run against Phase 1 builds:
- [ ] `register/seedPhrase.spec.js`, `linkDrop/newUser.spec.js`: in Phase 2+, assert the Feature Retired page.
- [ ] `linkDrop/signedInUser.spec.js`: claim works in Phase 2; retired in Phase 3 (D9).
- [ ] `swap/*`: retired from Phase 2.
- [ ] `loginWithDapp/*` (uses `testDapp`): Phase 2+ asserts the terminator and that the dApp receives the failure. Use the [guestbook](packages/guestbook) app (wallet-selector, redirect mode) for redirect, and add a near-connect popup harness for popup mode.
- [ ] `signMessageWithDapp/*`: works with a notice in Phase 2; terminator in Phase 3.
- [ ] `stakeUnstake/*`: stake retired in Phase 2, unstake works; all read-only in Phase 3.
- [ ] `transfer-tokens/*`, `nft/*`: work in Phase 2; retired in Phase 3.
- [ ] `recover/*`: works in **every** phase.
- [ ] **New:** `sunset/migrationAlwaysReachable.spec.js` walks select → method → manual export → reveal and copy in Phase 3.

### 8.3 Manual QA matrix (testnet and mainnet staging, real small accounts)

**Account types**, one wallet each (and one wallet holding all of them):
1. Named account, seed-phrase full-access key
2. Funded implicit account
3. Unfunded implicit account
4. Ledger account
5. 2FA account (and a **bricked** 2FA account on testnet)
6. Account with a lockup (with unlocked funds, and staking via lockup)
7. Account with native stake, pending unstake and withdrawable funds
8. Account with liquid staking (Meta Pool)
9. Account with farm rewards
10. Password-protected wallet
11. Wallet with more than 30 accounts (export cap)
12. Account with dApp function-call keys

**Flows**, per phase (P2, P3):
- Log in, unlock, import (phrase, key, Ledger, link)
- Import a non-existent phrase (blocked) versus an RPC outage (retry)
- Meteor transfer: start, activate, verify, resume after reload, start over, recovery
- Manual export, including for ineligible types
- Local removal
- Disable 2FA, then migrate
- dApp login and sign in popup mode and redirect mode, logged in and logged out, locked and unlocked
- CLI login
- Every retired deep link
- Mid-creation users (`/initial-deposit` with a funded implicit account)

**Browsers and devices:** Chrome, Firefox and Safari on desktop; iOS Safari and Android Chrome. Include popup mode on mobile, where popups are often blocked or open as tabs.

**"Must still work" rows**, re-run before **every** phase deploy:
- export key for each account type
- Meteor transfer end to end
- disable 2FA
- revoke app key
- view staking and lockup balances
- unlock a password-protected wallet

---

## 9. Rollout, monitoring and rollback

- **Mechanism:** a phase is a committed change to `SUNSET_PHASE` in `environmentDefaults/*.ts` plus a deploy. Order: `testnet` → `staging` (mainnet_STAGING) → `mainnet`, through the existing GitHub Actions → Cloudflare Pages workflows ([deploy-mnw-mainnet.yml](.github/workflows/deploy-mnw-mainnet.yml) on push to `mainnet`).
- **Rollback:** use Cloudflare Pages "rollback to previous deployment" for an immediate revert. Then commit the phase value back and redeploy so git matches production.
- **Stale tabs:** no service worker is used, so a deploy reaches users on their next load. A tab left open keeps the old phase until reload. That's acceptable because gating isn't a security boundary. Optionally, compare the bundle's phase with a tiny `/sunset.json` on route change and offer "Reload to update".
- **First 72 hours after each phase deploy**, watch:
  - `sunset_feature_blocked` by capability. Hits from `entry:'action'` mean a missed entry point.
  - `sunset_dapp_request_rejected` volume and hosts.
  - Migration funnel conversion, compared with the prior week.
  - Sentry error rate on `/export-accounts/*`.
  - Gleap ticket volume by macro.
- **Support readiness:** macros live, the FAQ published, and the team briefed on ineligible types, 2FA and lockup *before* each deploy.

---

## 10. Risks and mitigations

| Risk | Likelihood / impact | Mitigation |
| --- | --- | --- |
| A user can't migrate because their account type is unsupported (Ledger, 2FA, lockup) | Med / High | Guidance per reason (§6.8), manual export for every local key, reachable AccountLock path, the D7 lockup decision. Track `sunset_ineligible_guidance_clicked`. |
| NEAR's 2FA service is retired or unreliable | High / High | Helper-free relayed disable (§6.6.1). The remaining exposure is older contract versions and bricked accounts without a full-access phrase. Communicate early to 2FA users. |
| Meteor's 2FA relay is abused (deposit drain, gas griefing) | High until fixed / Med | The relay hardening in §4 must ship before §6.6.1 or the standalone app is promoted. |
| Meteor bridge outage during the Phase 3 window | Low / Med | Manual export is always available. The Feature Retired page links to both. |
| dApps show broken states after Phase 2 | Med / Med | The terminator always answers. Advance developer announcement; manifest and wallet-selector deprecation; target dApps found in analytics. |
| An entry point is missed and a "retired" action still runs | Med / Low | Action-layer asserts, a Sentry alert, and the optional transaction guard. |
| A user is told "no account found" during an RPC outage | Low / High | Block only on a definite `AccountDoesNotExist` with a successful indexer lookup (§6.1.4). |
| Users stranded mid-creation at Phase 2 deploy | Low / Med | The funded-implicit completion path (§6.1.1). |
| Phishing ("migrate your MNW wallet here") | High / High | In-app anti-phishing line, sunset page, support macros, a single official migration path. |
| Notice fatigue or alarm | Med / Low | One prompt per surface, no stacking, the cadence rules in §6.7 and §7.4, and calm copy ("your funds are safe"). |
| Copy dates go stale again | Med / Med | Dates come only from config (§5.5). Step 0 removes the hard-coded date now. |
| Translations lag behind English | Med / Low | Parity test blocks merge. Ship Step 0 in English if needed. |
| RPC rate limiting from migration-status probes across many accounts | Med / Low | Probe only on the hub and export screens, cache per session, and keep the single retry already in place. |

---

## 11. Suggested PR sequence

| # | PR | Phase | Depends on |
| --- | --- | --- | --- |
| 0 | **Hotfix:** sunset modal and banner copy without the stale date | now | none |
| 1 | Sunset config, capability model, QA override, PostHog super-property, tests | 2 | none |
| 2 | `SunsetGatedRoute`, `FeatureRetiredPage`, `assertSunsetCapability`, `sunset.*` i18n scaffolding, modal i18n | 2 | 1 |
| 3 | dApp terminator: shared failure helpers, `/login` gating, CLI copy, double-encoding fix | 2 | 2 |
| 4 | Account creation: routes, shared-route logic, CTAs, linkdrop, funded-implicit completion, import-nonexistent block, thunk asserts | 2 | 2 |
| 5 | Swap, Buy, Explore nav slot → Migrate | 2 | 2 |
| 6 | Staking: deposit retirement, withdraw auto-claim fix, banner; 2FA enable retirement; helper-free 2FA disable (§6.6.1); AccountLock reachable without the helper | 2 | 2, plus the Meteor relay hardening |
| 7 | Migration status service, global bar, contextual nudges, switcher chips, eligibility guidance, manual export for all local keys, balance checklist, Phase 3 advance notice | 2 | 1, 2 |
| 8 | e2e phase-awareness, new specs, QA pass → **Phase 2 release** | 2 | 3–7 |
| 9 | Phase 3 capabilities: send, NFT, receive, linkdrop, explore, profile actions, Ledger metadata no-op | 3 | 8 |
| 10 | dApp terminator for `/sign`, `/sign-message`, `/verify-owner` (+ sign-message failure status fix) | 3 | 3 |
| 11 | Migration Hub home, Phase 3 nav, read-only staking and lockup overview, Phase 3 modal | 3 | 7 |
| 12 | Transaction-shape guard (recommended) | 3 | 9 |
| 13 | Import notices in Phase 3, unlock "forgot password" explainer, guest landing | 3 | 9 |
| 14 | e2e and QA pass → **Phase 3 release** | 3 | 9–13 |

PRs 3–6 are independent of each other once PR 2 lands, so they can run in parallel.

---

## Appendix A: Existing bugs found during the survey

Fix the ones marked **(live path)**, because those code paths stay in use during the sunset.

1. **(live path)** `DISABLE_CREATE_ACCOUNT` doesn't disable creation for logged-in users, linkdrops or the funding routes. It is superseded by §6.1.
2. Duplicate `/create` route in `App.js`; the second one is dead.
3. **(live path)** Withdrawing on a farming validator does `Promise.all([[...]])`, so the farm claims aren't awaited ([Validator.js](packages/frontend/src/components/staking/components/Validator.js)).
4. **(live path in Phase 2)** The `/sign-message` popup reports a user rejection as `status: 'success'` with empty fields. The terminator sends `failure`; also fix the reject path in [SignMessageWrapper.js](packages/frontend/src/routes/SignMessageWrapper.js).
5. **(live path in Phase 2)** The `/sign` redirect double-encodes `errorMessage` (`encodeURIComponent` + `searchParams.set`, see `utils/buildUrl.js`).
6. Login's second-step Cancel doesn't notify the dApp. The InvalidContractId and multi-signer "return to app" buttons redirect even in popup mode, loading the dApp inside the popup.
7. **(fixed by §5.3)** dApp routes dead-end for logged-out users (guest landing) and locked wallets (the unlock page has no cancel).
8. **(fixed by §5.3)** `SunsetNotice` can open over dApp popups.
9. `failure_url` is not URL-encoded in the invalid-contract-id redirect (`redux/actions/account.js`).
10. `SignWrapper.js` references an undefined `DISPLAY.ACCOUNT_SELECTION`.
11. **(live path)** `SunsetNotice` is hard-coded English and contains a date that is about to pass (§0).
12. **(live path)** The bricked-2FA recovery `AccountLock.jsx` is unreachable, because the `WalletMigration` modal never opens (§6.6).
13. `/verify-owner` drops `keyType=0` because the value is falsy.
14. Documentation drift: `/sign` returns `signMeta`, but `packages/frontend/docs/SignTransaction.md` documents `meta`.

## Appendix B: Route-by-route plan

Guards: Pub = `PublicRoute`, Pwd = `PasswordProtectedRoute`, Priv = `PrivateRoute`, Rt = `Route`. ⛔ = Feature Retired page; ⛔dApp = dApp terminator.

| Route | Guard | Phase 2 | Phase 3 |
| --- | --- | --- | --- |
| `/` | GuestLanding / Wallet | Guest: import-first landing. Wallet: bar, banner, nudges | Migration Hub |
| `/set-password`, `/change-password` | Rt / Pwd | ✅ | ✅ |
| `/linkdrop/:fc/:fk` | Rt | Claim to existing ✅; "new account" hidden | ⛔ (D9) |
| `/create`, `/create/:fc/:fk`, `/create-from/:id` | Pwd | ⛔ | ⛔ |
| `/set-recovery/:accountId/...` | Pwd | ⛔ for new accounts; ✅ for existing | ⛔ |
| `/set-recovery-implicit-account`, `/setup-passphrase-new-account` | Pub | ⛔ | ⛔ |
| `/setup-ledger-new-account` | Pub | Existing implicit → `/sign-in-ledger`; otherwise ⛔ | same |
| `/create-implicit-account`, `/initial-deposit` | Pub / Pwd | Funded implicit → activate; otherwise ⛔ | same |
| `/setup-seed-phrase/:accountId/:step` | Pwd | ⛔ for new; ✅ for existing (D12) | ⛔ |
| `/verify-account`, `/fund-with-existing-account`, `/fund-create-account/...` | Pwd | ⛔ | ⛔ |
| `/setup-ledger/:accountId` | Pwd | ⛔ for new; ✅ for existing | ⛔ |
| `/setup-ledger-success` | Priv | ✅ | ⛔ (deletes keys on-chain) |
| `/enable-two-factor` | Priv | ⛔ | ⛔ |
| `/recover-account`, `/recover-seed-phrase`, `/recover-private-key`, `/recover-with-link/...`, `/auto-import-*`, `/sign-in-ledger` | Pwd | ✅ (non-existent → blocked) | ✅ + "import directly into Meteor" notice; Ledger metadata AddKey skipped |
| `/batch-import` | Pwd | ✅ | ✅ |
| `/batch-ledger-export` | Pwd | ✅ (unreachable from UI) | ⛔ (on-chain AddKey) |
| `/export-accounts/*`, `/export-accounts/neardotcom/guide` | Pwd / special | ✅ **never gated** | ✅ **never gated** |
| `/login`, `/login/` | Priv → Rt | ⛔dApp | ⛔dApp |
| `/sign` | Priv | ⚠️ notice (D4) | ⛔dApp |
| `/sign-message`, `/verify-owner` | Priv | ⚠️ notice (D4) | ⛔dApp |
| `/authorized-apps` | Priv | ✅ | ✅ revoke (D8) |
| `/full-access-keys` | Priv | ✅ | 🔒 view only |
| `/send-money/:accountId?` | Priv | ⚠️ (success nudge) | ⛔ |
| `/nft-detail/:contractId/:tokenId` | Priv | ✅ | 🔒 (transfer hidden) |
| `/receive-money` | Priv | ⚠️ nudge | ⛔ (D6) |
| `/buy` | Priv | ⛔ (D3) | ⛔ |
| `/swap` | Priv | ⛔ | ⛔ |
| `/profile/:accountId?` | Priv / Pwd | ✅ + Migration card; 2FA enable hidden | 🔒 + export key, disable 2FA, app connections, password |
| `/staking/*` | Priv | Stake ⛔; unstake, withdraw, claim ✅ | 🔒 overview |
| `/liquid-staking/*` | Priv | Stake ⛔; unstake, withdraw ✅ | 🔒 overview |
| `/transaction-history` | Priv | ✅ | ✅ |
| `/explore` | Priv | ✅ (nav slot → Migrate) | ⛔ |
| `/connection`, `/cli-login-success`, `/terms`, `/privacy` | Rt | ✅ | ✅ |
