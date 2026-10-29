# MyNearWallet Sunset: Phase 2 & Phase 3 Implementation Plan

| | |
| --- | --- |
| **Source** | [MyNearWallet Sunset POA](docs/mnw-sunset-plan/Private%20&%20Shared/MyNearWallet%20Sunset%20POA%203611c55b1a62806bb352d12a79a7075a.md) |
| **Scope** | Phase 2 (Migration-Focused Experience) now. Phase 3 (Limited Functionality Mode) is prepared behind a build flag and deployed on 1 November. |
| **Codebase** | `packages/frontend`, from `master` @ `4d6cad0a3`; working branch `paul/sunset-phase-3` |
| **Prepared** | Thursday 29 October 2026. Revised for a manual, flag-based Phase 3 deployment. |
| **Status** | **Current focus: Release A (Phase 2): complete, safe, deployable.** Decisions marked *before Release A* in [§4](#4-decisions) need confirming first. |

---

## Implementation status (29 Oct)

**Release A (Phase 2) is implemented on `paul/sunset-phase-3`, uncommitted, pending the QA matrix ([§9.2](#92-qa-matrix-release-a-phase-2)) and safety sign-off ([§6.8](#68-phase-2-safety-review)).**

- **Checks:** Jest 205/205 passing (57 new); `tsc` clean; ESLint shows only the 2 pre-existing errors; production Parcel build succeeds.
- **Visual check:** the main screens were checked visually against a local testnet build.
- **Code:** `src/config/sunset.ts` holds the flag and capability model; `src/components/sunset/` holds the UI.
- **Default phase:** every deployed environment now defaults to `SUNSET_PHASE: 2`, so the next deploy of `master` (staging), `testnet` or `mainnet` ships Phase 2.

Deviations from this plan:
- **`/setup-ledger-new-account` is fully retired** rather than keeping its redirect branch. Existing Ledger users import through *Import existing account → Ledger*.
- **Send and Receive get no inline notice.** The global sunset bar already appears there, and two prompts on one page is noise.
- **Staking pages hide the bar** because they carry their own, more specific notice.
- **Interim 2FA handling keeps MNW's existing "Disable 2FA"** and links to it from the guidance ("Turn off 2FA" switches to that account and opens Profile). Hiding it if NEAR's helper turns out to be down is **not** built yet; that needs the helper status first.
- **Not built (the "can follow" items in §6.0):** account-switcher status chips, bar progress counts, the post-migration balance checklist, and automatic activation of a funded implicit account on the old creation routes. The creation retired page tells those users to import instead.
- **e2e specs are not updated yet** (Release C, §8.8).

---

## 0. Timeline and delivery strategy

| Release | What | When | How |
| --- | --- | --- | --- |
| **A: Phase 2** | Everything in [§6](#6-release-a-phase-2) | Build Thu 29 Oct; deploy **Fri 30 Oct** once [§6.10](#610-release-a-checklist-deploy-and-rollback) passes | Build flag `SUNSET_PHASE=2` |
| **B: Phase 3** | Everything in [§7](#7-release-b-phase-3-behind-the-flag) | Build Fri–Sat behind the flag; **a new deployment on Sun 1 Nov** | Flip the flag to `SUNSET_PHASE=3` |
| **C: Follow-ups** | Helper-free 2FA disable, Migration Hub, staking overview, transaction guard, e2e, cleanup ([§8](#8-release-c-follow-ups-from-mon-2-nov)) | From Mon 2 Nov | Normal releases |

### Principles
1. **Phase 2 first, finished properly.** Release A is built, tested and deployed on its own merits. Nothing in it depends on Phase 3 work.
2. **The phase is a build flag, not a schedule.** Each phase change is a deliberate deployment.
   - Rolling back a phase is a Cloudflare Pages rollback to the previous deployment ([§7.4](#74-rollback)).
   - No date logic in the bundle decides behaviour.
3. **Phase 3 code is inert at `SUNSET_PHASE=2`.** Release B work can merge to `master` while mainnet runs Phase 2, because nothing changes until the flag is flipped. The phase-2 route-gating tests ([§9.1](#91-unit-tests-jest)) protect this.
4. **On 1 November the only change is the flag.** The code deployed on 1 Nov is the code QA'd on staging with `SUNSET_PHASE=3` on Saturday.

### Day by day
| Day | Work |
| --- | --- |
| **Thu 29** | Confirm the *before Release A* decisions ([§4](#4-decisions)). Build Release A (PRs 1–9, [§12](#12-pr-sequence)). **In parallel, outside this repo:** harden the Meteor 2FA relay, confirm the status of NEAR's 2FA helper, open the near-connect manifest PR, write the Phase 2 support macros. |
| **Fri 30, morning** | Finish Release A. Jest and lint green. Deploy to testnet and staging; run the Phase 2 QA matrix ([§9.2](#92-qa-matrix-release-a-phase-2)) and safety review ([§6.8](#68-phase-2-safety-review)). |
| **Fri 30, afternoon** | **Mainnet deploy of Release A** ([§6.10](#610-release-a-checklist-deploy-and-rollback)). Brief support. Start Release B (PRs 10–13). |
| **Sat 31** | Finish Release B. **Dress rehearsal:** deploy testnet and mainnet staging with `SUNSET_PHASE=3` and run the Phase 3 QA matrix ([§9.3](#93-qa-matrix-release-b-phase-3)). Rehearse the rollback. Lock D6–D9. Phase 3 support macros and sunset-page update ready. |
| **Sun 1 Nov** | **Release B deployment** at the agreed time (D1), following the runbook ([§7.3](#73-deployment-runbook-sun-1-nov)). Monitor. |
| **Mon 2 Nov onward** | Release C, with the **helper-free 2FA disable first**. |

---

## 1. Goals and invariants

### Goals (from the POA)
1. Move users to supported wallets gradually, with Meteor presented as the preferred path.
2. Keep essential functionality in each phase. Phased-out features **redirect into migration flows** and never dead-end.
3. Keep migration simple and guided. Avoid forced security complexity.
4. Communicate clearly and consistently.

### Invariants: these must hold in every phase
Every PR is reviewed against this list. Items are covered by tests where possible ([§9](#9-test-strategy)).

1. **Users can always get their keys out.** Unlock, manual export and the Profile "export private key" keep working for every account that has a local key.
2. **Migration flows are never gated.** All `/export-accounts/*` routes stay open, including resume, recovery, start-over, the NEAR.com guide and local removal. Their on-chain AddKey and DeleteKey calls ([meteorConnectAddKeyChain.js](packages/frontend/src/services/meteorConnectAddKeyChain.js)) are never blocked.
3. **Disabling 2FA always works, without NEAR's 2FA service.** Meteor's transfer refuses 2FA accounts (`two_factor_unsupported`), so disabling 2FA is a required migration step. It must not depend on NEAR's helper ([§8.1](#81-helper-free-2fa-disable-top-priority); interim handling in [§6.5](#65-account-security)).
4. **Getting in always works.** Log in, import, recover, password unlock, Ledger sign-in, `/batch-import` and `/recover-with-link` stay open.
5. **Funds stay visible.** Balances, tokens, NFTs, staking positions, lockup balances and activity remain viewable.
6. **Every dApp request gets an answer.** Any request MNW refuses gets a failure callback. It never hangs, 404s, or drops into guest landing or an unlock screen with no way back.
7. **Each phase change is one reversible deployment.** No phase behaviour depends on the date or the user's clock.
8. **Higher-phase code is inert.** At `SUNSET_PHASE=N`, nothing retired only in a phase above N changes behaviour.
9. **Analytics stays clean.** No secrets, full URLs or URL fragments. The existing PostHog sanitisation still applies.

> **Client-side gating is UX, not security.** Accounts live on-chain and work from any wallet or CLI. We steer users toward migrating and stop MNW *originating* new activity; we cannot stop anyone using their own account.

---

## 2. Where we are (Phase 1 is complete)

| Delivered | Where |
| --- | --- |
| Sunset modal (every 4 days, hard-coded English; says "deprecated on 31 October 2026") | [app/SunsetNotice.tsx](packages/frontend/src/app/SunsetNotice.tsx) |
| Home banner with migration entry and resume detection | [wallet/AccountExportBanner.jsx](packages/frontend/src/components/wallet/AccountExportBanner.jsx) |
| Account selection with eligibility checks (up to 30 accounts) | [AccountExportSelect.jsx](packages/frontend/src/components/account-export/AccountExportSelect.jsx), [accountExportAccounts.js](packages/frontend/src/components/account-export/accountExportAccounts.js) |
| Method choice: Meteor Connect new-key transfer (recommended), NEAR.com guide (mainnet), manual export | [AccountExportMethod.jsx](packages/frontend/src/components/account-export/AccountExportMethod.jsx) |
| Meteor new-key transfer: crash-safe record of each step, activation, verification, recovery, start-over | `AccountExportNewKey*.jsx`, [services/meteorConnect.js](packages/frontend/src/services/meteorConnect.js) |
| Manual private-key reveal and copy; local-only removal | [AccountExportManual.jsx](packages/frontend/src/components/account-export/AccountExportManual.jsx), [AccountExportRemove.jsx](packages/frontend/src/components/account-export/AccountExportRemove.jsx) |
| PostHog migration funnel (about 60 events) | [accountExportAnalytics.js](packages/frontend/src/components/account-export/accountExportAnalytics.js) |

**Gaps that Release A must close:**
- **There is no feature-flag system.** `DISABLE_CREATE_ACCOUNT` (`true` on mainnet) **does not stop account creation** ([§6.1](#61-account-creation)).
- **Some accounts can't use any migration method.** Only `availability === 'available'` accounts can be selected, and manual export is limited to those. Ledger, 2FA, unfunded-implicit, `no_local_key` and `not_full_access` accounts get a reason but no next step.
- **2FA accounts have no working path.** Both of MNW's 2FA disable paths depend on NEAR's helper ([§8.1](#81-helper-free-2fa-disable-top-priority)).
- **The modal is English-only** and not aware of the phase.

---

## 3. Capability matrix

This table is the single source of truth. The config in [§5.1](#51-phase-flag-and-capability-model) encodes it directly.

✅ available · ⚠️ available with a sunset notice · 🔒 read-only · ⛔ retired: entry points hidden, direct URLs show the Feature Retired page · ⛔dApp: the dApp terminator answers the request · **C** = richer version in Release C · **Dn** = decision in [§4](#4-decisions)

| Capability | Today | **Phase 2** (Release A) | **Phase 3** (Release B) |
| --- | --- | --- | --- |
| View balances, tokens, NFTs, activity | ✅ | ✅ | 🔒 |
| Log in, import, recover, unlock, Ledger sign-in | ✅ | ✅ | ⚠️ "you can import directly into your new wallet" |
| Migration flows (`/export-accounts/*`) | ✅ | ✅ | ✅ |
| Export private key (manual export and Profile) | ✅ | ✅, extended to every local key | ✅, primary action |
| **Create account** (every path, including linkdrop "new account") | ✅ | ⛔ | ⛔ |
| Import a key with no on-chain account (silent zero-balance creation) | ✅ | ⛔ D10 | ⛔ |
| **Swap** | ✅ | ⛔ | ⛔ |
| Buy / on-ramp | ✅ | ⛔ D3 | ⛔ |
| Explore page | ✅ | ✅ (nav slot becomes "Migrate") | ⛔ |
| **dApp: new connection** (`/login`, including CLI) | ✅ | ⛔dApp | ⛔dApp |
| dApp: sign transactions (`/sign`) | ✅ | ⚠️ D4 | ⛔dApp |
| dApp: sign message / verify owner | ✅ | ⚠️ D4 | ⛔dApp |
| **Send** NEAR / FT | ✅ | ⚠️ | ⛔ |
| NFT transfer | ✅ | ✅ | ⛔ (NFT stays viewable) |
| Receive page | ✅ | ⚠️ | ⛔; account ID shown read-only D6 |
| Linkdrop: claim into existing account | ✅ | ✅ | ⛔ D9 |
| **Stake** (native deposit, liquid stake, lockup pool select) | ✅ | ⛔ D2 | ⛔ |
| Unstake, withdraw, claim farm rewards | ✅ | ⚠️ | 🔒 positions shown, actions hidden (C: overview) |
| Lockup "transfer to wallet" (into the user's own account) | ✅ | ✅ | ✅ D7 |
| Enable 2FA | ✅ | ⛔ | ⛔ |
| **Disable 2FA** | ✅ (needs NEAR helper) | ✅ + interim guidance | ✅ (C: helper-free) |
| Add seed-phrase recovery / add full-access key | ✅ | ✅ D12 | ⛔ |
| Enable, disable or reconnect Ledger | ✅ | ✅ | ⛔ |
| Revoke authorized-app keys | ✅ | ✅ | ✅ D8 |
| Remove full-access keys | ✅ | ✅ | ⛔ D8 (list stays viewable) |
| Ledger sign-in metadata AddKey (on-chain, implicit) | ✅ | ✅ | skipped |
| Password, RPC settings, Gleap support, terms, privacy | ✅ | ✅ | ✅ |

**Rule:** a retired capability stays retired in later phases. The config model enforces this.

---

## 4. Decisions

Each decision has a default that the build uses unless someone objects.

### Before Release A (today)
| # | Decision | Default | Why |
| --- | --- | --- | --- |
| D2 | New staking deposits in Phase 2 | **Disable** | A stake made now can't be managed in MNW from 1 Nov. Override if the Phase 2 announcement promised staking until 31 Oct. |
| D3 | Buy / on-ramp in Phase 2 | **Disable** | Funding a wallet that enters limited mode in days works against migration. Same override rule as D2. |
| D4 | `/sign` and `/sign-message` in Phase 2 | **Keep, with a notice** ("app approvals end on 1 November"). Block only `/login`. | MNW keeps **no record** of which dApps are connected ([§6.3](#63-dapp-requests)), so `/sign` can't tell existing connections from new ones. |
| D5 | Error code returned to dApps | **Reuse the existing codes** (`USER_CANCELLED` for login, `userRejected` for sign) and put the sunset explanation in `errorMessage` | dApps already handle these. near-connect shows `errorMessage` to the user. |
| D10 | Importing a key with no on-chain account | **Block** | Today this quietly creates an implicit account. |
| D11 | "Other supported wallets" list | Meteor-only copy until NEAR Foundation provides a list | POA: users may migrate elsewhere manually. |
| D12 | Adding seed-phrase recovery in Phase 2 | **Keep** | It gives users a portable phrase. Retired in Phase 3. |

### Before Release B (by Saturday)
| # | Decision | Default | Why |
| --- | --- | --- | --- |
| D1 | **Phase 3 deployment time on Sun 1 Nov**, and who is on call | **08:00–10:00 UTC** | By then it is 1 November in almost every populated time zone, matching "after 31 October", and the team is awake for monitoring. |
| D6 | Receive in Phase 3 | Retire `/receive-money`. **Keep the account ID visible and copyable.** | Users need their address to verify migration. Funds sent later still arrive on-chain. |
| D7 | Lockup "transfer to wallet" in Phase 3 | **Keep it allowed** until Meteor confirms it supports lockup accounts | It moves funds into the user's own main account, which can then be migrated. |
| D8 | Key management in Phase 3 | **Keep revoking app keys. Retire adding and removing full-access keys.** | Revoking improves security. Removing full-access keys is high-risk and belongs in the new wallet. |
| D9 | Linkdrop claim in Phase 3 | **Retire**, with "claim this link with another wallet" | Unclaimed linkdrop funds stay with the link. |

### External dependencies (outside this repo, start today)
- **NEAR's 2FA service, part of NEAR's helper (`helper.mainnet.near.org`): confirm its status today.**
  - Every 2FA path in MNW depends on it: each send and unstake confirmation, `disableMultisig` (SMS/email code), and `disableWithFAK` (its `/2fa/getAccessKey` lookup).
  - The [2fa-recovery](https://github.com/Meteor-Wallet/2fa-recovery) app describes it as "retired".
  - The answer decides the interim 2FA handling in Release A ([§6.5](#65-account-security)).
- **Meteor 2FA confirm relay** (`meteor_backend_v2` `POST /api/relay/confirm_2fa`). **Security fix needed today, whatever happens with MNW.** It only checks the request's shape. Required changes:
  - **Reject any non-zero deposit.** The relayer pays deposits attached inside a meta-transaction, and they land in the sender's account, so anyone can drain the relayer. Verify on testnet with a tiny amount.
  - Cap gas.
  - Rate-limit.
  - Before spending gas, check the target account's code hash, `get_num_confirmations == 2`, and that `request_id` exists.
  - Alert on the relayer's balance.
- **Meteor Connect production bridge** must stay available.
- **What Meteor supports:** lockup accounts (D7), Ledger accounts, staking and liquid-staking views, linkdrop claims (D9), and accounts that still have the multisig contract deployed ([§8.1](#81-helper-free-2fa-disable-top-priority) fallback).
- **near-connect manifest** (`hot-dao/near-selector`, entry `mynearwallet`):
  - Open a PR **today** removing the `signIn*` features, since new connections are retired in Phase 2.
  - On 1 Nov, open a PR removing the signing features or the whole entry.
  - **wallet-selector:** ask NEAR to deprecate `@near-wallet-selector/my-near-wallet`.
- **Indexers** (FastNear, Nearblocks) for account discovery during import.

---

## 5. Shared foundation (built in Release A)

### 5.1 Phase flag and capability model

**New file `packages/frontend/src/config/sunset.ts`.** Each capability records the phase it is *disabled from*. That makes retired capabilities stay retired, and keeps higher-phase entries inert (invariant 8):

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
    createAccount: 2, importNonExistentAccount: 2, swap: 2, buy: 2 /* D3 */, dappConnect: 2,
    stakeDeposit: 2 /* D2 */, enableTwoFactor: 2,
    explore: 3, dappSign: 3, dappSignMessage: 3, send: 3, nftTransfer: 3, receive: 3,
    linkdropClaim: 3, stakeManage: 3, addRecoveryMethod: 3, manageLedger: 3,
    removeFullAccessKey: 3, ledgerMetadataKey: 3,
    lockupTransfer: null /* D7 */,
};

export const SUNSET_PHASE: SunsetPhase = resolvePhase(); // build flag, plus the non-mainnet QA override
export const isSunsetCapabilityEnabled = (cap: SunsetCapability, phase = SUNSET_PHASE) =>
    DISABLED_FROM[cap] == null || phase < DISABLED_FROM[cap]!;
```

**Build flag plumbing:**
- [ ] **`SUNSET_PHASE`** is read in [configFromEnvironment.ts](packages/frontend/src/config/configFromEnvironment.ts), the same way as `NEAR_WALLET_ENV`. Parcel inlines `process.env.*` at build time, so the phase is fixed per bundle.
- [ ] **Validate it as `1 | 2 | 3`; anything else fails the build.** Treat an **empty string as unset**, because GitHub Actions passes `''` for a missing `vars.*`.
- [ ] **Defaults** live in [environmentDefaults/](packages/frontend/src/config/environmentDefaults). They apply when the variable is unset:
  - `mainnet`, `mainnet_STAGING`, `testnet`, `testnet_STAGING`: `2` (committed in Release A)
  - `development`: `1`
- [ ] **Wire the flag through CI.** In [cloudflare-pages-deploy.yml](.github/workflows/cloudflare-pages-deploy.yml), add `SUNSET_PHASE: ${{ vars.SUNSET_PHASE }}` to the job `env` beside `NEAR_WALLET_ENV`. Each GitHub environment (`mainnet`, `mainnet-staging`, `testnet`, `testnet-staging`) then gets its own value.
- [ ] **Let a deploy run without a code push.** Add `workflow_dispatch:` to [deploy-mnw-mainnet.yml](.github/workflows/deploy-mnw-mainnet.yml) (and the testnet and staging workflows), so flipping the flag can trigger a deploy of the same commit. Today they only run on a push.
- [ ] **Make the phase visible in the build log** (one line from `runBundler.js` or a CI step). In the app, expose a read-only `window.mnwSunset = { phase, source: 'build' | 'qa-override' }` so the runbook can confirm what is live.
- [ ] **QA override on non-mainnet builds only** (`NEAR_WALLET_ENV !== 'mainnet'`): `?sunset_phase=N` is stored in `sessionStorage` and shown as a "QA: phase N" chip, so staging can show both phases from one build. **Ignored on mainnet.**
- [ ] **Copy-only date:** `SUNSET_PHASE_3_DATE = '2026-11-01'` drives the Phase 2 text ("on 1 November") and **nothing else**.
- [ ] **PostHog:** register `sunset_phase` as a super-property, next to the existing `wallet_environment` in [posthog/index.js](packages/frontend/src/posthog/index.js).

### 5.2 Gating primitives: three required layers and one optional

| Layer | Primitive | Purpose |
| --- | --- | --- |
| 1. Entry points | `useSunsetCapability(cap)` | Hide or replace buttons, nav items, banners and CTAs |
| 2. Routes | `<SunsetGatedRoute capability=… guard=… …>` (guard = the route's existing guard component) | Direct URLs and deep links render the **Feature Retired page** |
| 3. Actions | `assertSunsetCapability(cap)` at the top of each thunk or service that starts the action | Catches any entry point we missed. Throws `SunsetCapabilityError`, which the UI shows as the retired message, and which dApp flows send back to the dApp as a failure. |
| 4. Transactions (optional, Release C) | Transaction-shape allowlist in the lockup decorator | Last line of defence ([§8.7](#87-transaction-shape-guard-defence-in-depth)) |

`SunsetGatedRoute` notes:
- React-router v5 `<Switch>` matches on child `path`/`exact` props, so a wrapper component works in place.
- When the capability is disabled it renders a plain `<Route>`, **not** the original guard. `PasswordProtectedRoute` would show `SetPasswordPage` or the unlock screen first, and `PrivateRoute` would bounce guests to `/`.

**Feature Retired page** (new: `components/sunset/FeatureRetiredPage.jsx`):
- Title and body: "{Feature} is no longer available in MyNearWallet. MyNearWallet is being retired; your funds are safe in your account on NEAR." Plus one line per capability, for example "After you migrate, you can swap tokens in Meteor Wallet."
- **Primary:** "Migrate my accounts" (or "Resume account transfer" if one is pending; [§5.4](#54-migration-entry-and-per-account-status)).
- **Secondary:** "Back to wallet". **Link:** "Why is this happening?" → sunset page.
- **Accessibility:** a heading receives focus when the page appears; the explanatory notice uses `role="note"`; every action is keyboard-reachable.
- Fires `sunset_feature_blocked { capability, entry, phase }` with the route *pattern*, never the raw URL.
- Visual style reuses [AccountExportNotice.jsx](packages/frontend/src/components/account-export/AccountExportNotice.jsx) and the export page containers.

### 5.3 dApp request terminator

**New: `components/sunset/DappRequestRetired.jsx`.** It is built for all four kinds now. Release A only routes `/login` to it; Release B adds the others.

How MNW talks to dApps today:
- MNW chooses popup or redirect **only by checking `window.opener`**.
- It never calls `window.close()`.
- Each popup reply is a `postMessage` to the callback URL's origin, followed by a 3-second fallback redirect.

| Request | Popup (near-connect `mnw` executor) | Redirect (near-api-js, wallet-selector ≤ 8.x) | No callback |
| --- | --- | --- | --- |
| `/login` | `{status:'failure', errorCode:'USER_CANCELLED', errorMessage}` → `failure_url` origin | `failure_url`, validated with the blocked-protocol check in [helper-api.ts](packages/frontend/src/utils/helper-api.ts) | CLI copy ("`near login` with MyNearWallet is no longer supported…") |
| `/sign` | `{status:'failure', signMeta, errorCode:'userRejected', errorMessage}` | `callbackUrl?signMeta&errorCode=userRejected&errorMessage=…`, encoded **once** | Back to wallet |
| `/sign-message` | `{status:'failure', errorMessage}` | `callbackUrl#error=…` | Back to wallet |
| `/verify-owner` | n/a (no popup support) | `callbackUrl?meta&error=…` | Back to wallet |

UX:
- **Title:** "MyNearWallet can't connect to apps anymore" (`/login`) or "MyNearWallet can no longer approve app requests" (Phase 3).
- **Body:** names the requesting host (`new URL(callback).host`) and tells the user to choose another wallet in that app, or migrate first.
- **Primary:** "Return to {host}". It sends the failure response, with the existing 3-second fallback.
- **Secondary:** "Migrate my accounts". In popup mode it opens in a new tab so the dApp's popup channel survives.
- **No automatic redirect.** If the user closes the popup, near-connect already rejects with "User closed the window".

Tasks:
- [ ] **Pull out shared failure helpers** (`sendLoginFailure`, `sendSignFailure`, `sendSignMessageFailure`, `sendVerifyOwnerFailure`) from [SelectAccountLoginWrapper.js](packages/frontend/src/components/login/v2/SelectAccountLoginWrapper.js), [SignWrapper.js](packages/frontend/src/routes/SignWrapper.js), [SignMessageWrapper.js](packages/frontend/src/routes/SignMessageWrapper.js) and [VerifyOwnerWrapper.js](packages/frontend/src/routes/VerifyOwnerWrapper.js).
  - **In Release A, only the login helper is wired in.** The existing sign cancel paths stay exactly as they are, so Phase 2 doesn't change `/sign` behaviour beyond the notice.
  - Release B switches the sign paths over and fixes the double encoding and the sign-message status bugs (Appendix A).
- [ ] **Render before every auth or unlock guard.** Logged-out users are bounced to guest landing today, and the unlock page has no cancel.
- [ ] **Cover both URL forms.** `/login` is not `exact`, so `/login/` (the near-api-js form) also has to be gated.
- [ ] **Skip login URL processing when `dappConnect` is off.** In [redux/actions/account.js](packages/frontend/src/redux/actions/account.js), `handleRefreshUrl` runs `checkContractId` (an RPC call) and can redirect to `/login/?invalidContractId=…`.
- [ ] Suppress `SunsetNotice` and the global sunset bar on dApp routes; they can currently appear inside popups.
- [ ] Fire `sunset_dapp_request_rejected { kind, mode, host }` with the host only.

### 5.4 Migration entry and per-account status
- [ ] **`useMigrationEntryRoute()`.** Pull the resume logic out of [AccountExportBanner.jsx](packages/frontend/src/components/wallet/AccountExportBanner.jsx). Every "Migrate" CTA then goes to the right place: start, or resume at activation or verification.
- [ ] **`mnw:sunset:exported` marker** (`{ [accountId]: { method, at } }`, **no key material**), written when a key is revealed or copied in manual export.
- [ ] **Nice-to-have (not blocking Release A): `useMigrationStatus()`.** Per-account status combining the Meteor journal (`in_progress` / `secured`), the marker (`key_exported`, unverified) and eligibility. Eligibility comes from `loadExportableAccounts()`, which makes several RPC reads per account, so call it only on the home screen and export screens and cache it for the session.

### 5.5 Copy and translations
- [ ] **New `sunset.*` namespace** with `phase2` and `phase3` variants. Phase 2 copy says what changes "on 1 November". Final wording follows the Phase 2 announcement.
- [ ] **All 9 locales** (`en, it, pt, ru, tr, ua, vi, zh-hans, zh-hant`) in the release that introduces each string, using `react-i18next` like the export flow. Machine-quality translation is acceptable now; native review is in Release C.
- [ ] Extend [newKeyTransferLocaleParity.test.js](packages/frontend/src/translations/newKeyTransferLocaleParity.test.js) to cover `sunset.*`.
- [ ] Move `SunsetNotice` onto translation keys.
- [ ] **Anti-phishing line** in the modal, the bar and support macros: "We will never ask for your recovery phrase or private key by email, DM or on any other website. Migration only happens inside app.mynearwallet.com."
- [ ] **Terminology:** "private key (starts with `ed25519:`)" and "12-word recovery phrase", never "password" or "secret". The [support ticket](docs/user-issue/implicit-account-migration-passphrase-ticket-response.md) shows users confuse them.
- [ ] **Promise nothing beyond what's decided.** Phase 2 copy names 1 November and nothing later. No final shutdown date until Phase 4 is agreed.

### 5.6 Analytics and monitoring
| Event | Properties | Used for |
| --- | --- | --- |
| `sunset_feature_blocked` | capability, entry (`route`, `action` or `button`), phase | Finding missed entry points and sizing support load |
| `sunset_retired_cta_clicked` | capability, cta | Whether retired pages turn into migrations |
| `sunset_dapp_request_rejected` | kind, mode, host | dApp outreach list |
| `sunset_notice_shown` / `_cta_clicked` | phase, variant | Notice fatigue |
| `sunset_ineligible_guidance_clicked` | availability, action | Which account types are stuck |
| `sunset_import_nonexistent_blocked` | method | D10 impact |

- [ ] **PostHog dashboard, ready before the Release A deploy:** migration funnel by `sunset_phase`, blocked hits by capability, dApp rejections by host, and `entry:'action'` hits.
- [ ] **Sentry alert** on any `SunsetCapabilityError` thrown at the action layer. Each one is a missed UI entry point.

---

## 6. Release A: Phase 2

### 6.0 Definition of done
Phase 2 is **complete** when every item below has shipped.

| # | Area | Section |
| --- | --- | --- |
| 1 | Phase flag, capability model, CI wiring, QA override, tests | §5.1, §9.1 |
| 2 | Gating primitives and the Feature Retired page with a migrate CTA | §5.2 |
| 3 | **Account creation retired everywhere**: routes, shared routes, CTAs, linkdrop "new account", trial drops, action asserts, import of non-existent accounts | §6.1 |
| 4 | Swap and Buy retired; the Explore nav slot becomes "Migrate" | §6.2 |
| 5 | **The `/login` terminator** in every state (popup, redirect, CLI, logged out, locked); notices on `/sign`, `/sign-message`, `/verify-owner` | §5.3, §6.3 |
| 6 | Staking deposits retired; staking notice | §6.4 |
| 7 | Enable 2FA retired; interim 2FA handling | §6.5 |
| 8 | **Migration prompts throughout**: modal, home banner, global bar, nav, notices on Send, Receive, Staking and Sign | §6.6 |
| 9 | **Migration flow completeness**: guidance for every eligibility reason, manual export for every local key, "Export keys" entry | §6.7 |
| 10 | Translations in all locales; parity test | §5.5 |
| 11 | Analytics events, dashboard, Sentry alert | §5.6 |
| 12 | Safety review passed; QA matrix passed; rollback rehearsed | §6.8, §9.2, §6.10 |

**Can follow without risk** (they don't block Phase 2):
- Per-account migration status with progress counts and account-switcher chips (§5.4)
- The post-migration balance checklist (§6.7)
- Automatically activating an implicit account a user funded mid-creation (§6.1); the retired page already tells them how to get it back

### 6.1 Account creation

**Background:** `DISABLE_CREATE_ACCOUNT` is checked in one place only, `/create` in [App.js](packages/frontend/src/app/App.js), and only for logged-out users. On mainnet today:
- Logged-in users can still create named accounts (`/fund-with-existing-account` → `create_account`).
- Linkdrop "Claim with New Account" still creates them (`create_account_and_claim`).
- Guests are routed into the implicit-account flow.

Replace the flag's check with the `createAccount` capability, and keep the flag only as a legacy alias that can make gating stricter, never looser.

**Routes → `SunsetGatedRoute capability='createAccount'`:**
- [ ] `/create` (also delete the dead duplicate `/create` route), `/create/:fundingContract/:fundingKey`, `/create-from/:fundingAccountId`
- [ ] `/set-recovery-implicit-account`, `/setup-passphrase-new-account`, `/create-implicit-account`, `/initial-deposit`, `/verify-account`, `/fund-with-existing-account`, `/fund-create-account/...`
- [ ] `/setup-ledger-new-account`: keep its existing redirect to `/sign-in-ledger` when the Ledger's implicit account already exists; retire only the creation branch.
- [ ] `/enable-two-factor`, under `enableTwoFactor`
- [ ] **Safety copy on the creation retired page:** "Started creating an account and already funded it? Import it with your recovery phrase from *Import existing account*. Your funds are safe." A funded implicit account exists on-chain, so importing it works normally.
- [ ] *Can follow:* on `/initial-deposit` and `/create-implicit-account`, if the implicit account already exists on-chain, activate it directly instead of showing the retired page.

**Shared routes.** `/set-recovery/:accountId`, `/setup-seed-phrase/:accountId/:step` and `/setup-ledger/:accountId` serve both creation and existing accounts. They decide which by calling `checkIsNew(accountId)` on-chain.
- [ ] Show the retired page when `createAccount` is disabled **and** any of these holds: `checkIsNew` is true, `fundingOptions` is present, or it's a trial drop.
- [ ] **If `checkIsNew` errors, show retry.** Never fall through to creation, and never show "retired" for what may be an existing account.
- [ ] **Existing-account uses must keep working:** Profile "enable seed phrase", Full Access Keys "add key" (`?addKey=true`), Hardware Devices "enable Ledger". These are safety-review items (§6.8).

**Entry points, via `useSunsetCapability('createAccount')`:**

| Location | Change |
| --- | --- |
| [GuestLanding.js](packages/frontend/src/components/landing/GuestLanding.js) | **"Import existing account"** becomes the primary CTA. Add "MyNearWallet no longer creates new accounts. New to NEAR? Get Meteor Wallet". Keep the `homePageImportAccountButton` test id. |
| [CreateAccountBtn.js](packages/frontend/src/components/navigation/CreateAccountBtn.js) (`DesktopMenu.js`, `MobileContainer.js`) | Hide |
| [CreateCustomNameLightBanner.js](packages/frontend/src/components/wallet/CreateCustomNameLightBanner.js), [CreateCustomNameModal.js](packages/frontend/src/components/wallet/CreateCustomNameModal.js) | Hide / suppress |
| [AutoImport.js](packages/frontend/src/components/accounts/auto_import/AutoImport.js) failure "Create New Account" | Replace with "Try another import method" → `/recover-account` |
| [NearDropLanding.js](packages/frontend/src/components/accounts/linkdrops/NearDropLanding.js) "Claim with New Account" | Hide. Keep "Claim with Existing Account" and "Log In and Claim". |
| [TrialDropLanding.js](packages/frontend/src/components/accounts/linkdrops/TrialDropLanding.js) "Secure Account" | Retire |

**Action asserts:**
- [ ] [createAccountThunks.js](packages/frontend/src/redux/slices/account/createAccountThunks.js): `createNewAccount`, `createIdentityFundedAccount`, `createAccountFromImplicit`, `createAccountWithSeedPhrase`, `createNewAccountWithCurrentActiveAccount`, `initiateSetupForZeroBalanceAccountPhrase`, `initiateSetupForZeroBalanceAccountLedger`
- [ ] `fundCreateAccount`, `fundCreateAccountLedger`, the creation branch of `handleCreateAccountWithSeedPhrase`, and `wallet.createNewAccountLinkdrop`

**Stop imports from creating accounts (D10).** These paths fall back to `wallet.importZeroBalanceAccount` when the derived account isn't on-chain:
- [RecoverAccountSeedPhrase.js](packages/frontend/src/components/accounts/RecoverAccountSeedPhrase.js)
- [RecoverAccountPrivateKey.js](packages/frontend/src/components/accounts/RecoverAccountPrivateKey.js)
- [SignInLedgerWrapper.js](packages/frontend/src/components/accounts/ledger/SignInLedgerWrapper.js)
- [ImportAccountWithLinkWrapper.js](packages/frontend/src/routes/ImportAccountWithLinkWrapper.js)
- [importAccountThunks.js](packages/frontend/src/redux/slices/importZeroBalanceAccount/importAccountThunks.js)

Tasks:
- [ ] Show "No NEAR account was found for this recovery phrase. MyNearWallet can no longer create new accounts. Check the phrase was entered correctly. Your phrase also works in Meteor Wallet and other NEAR wallets."
- [ ] **Block only on a definite `AccountDoesNotExist`**, and only after the indexer lookup has *succeeded* with no results. Reuse `isAccountDoesNotExistError` from [accountExportAccounts.js](packages/frontend/src/components/account-export/accountExportAccounts.js). If the RPC or indexer fails, show retry.

**Leave alone:** `WALLET_CREATE_NEW_ACCOUNT_FLOW_URLS`. It also lists recovery pages and is substring-matched in four places. Clean it up in Phase 4.

### 6.2 Swap, Buy, Explore
- [ ] `/swap` → gated. Hide the Swap button in [Wallet.js](packages/frontend/src/components/wallet/Wallet.js). Assert in `utils/hooks/useSwap.js` and `services/tokenExchange/FungibleTokenExchange.js` (which also covers the NEAR↔wNEAR path). Skip `swapActions.fetchSwapData` while swap is disabled.
- [ ] **(D3)** `/buy` → gated. Hide **Top Up**, [DepositNearBanner.js](packages/frontend/src/components/wallet/DepositNearBanner.js) and the buy link in [explore/components/Banner.js](packages/frontend/src/components/explore/components/Banner.js). Stop the MoonPay and helper `/moonpay/signURL` calls when [BuyNear.js](packages/frontend/src/components/buy/BuyNear.js) loads.
- [ ] In [NavLinks.js](packages/frontend/src/components/navigation/NavLinks.js), the Explore slot becomes **"Migrate"** (→ `useMigrationEntryRoute()`). `/explore` stays reachable by URL in Phase 2.

### 6.3 dApp requests
- [ ] `/login` and `/login/` → `DappRequestRetired kind='login'` for logged-in, logged-out and locked users alike. Assert `dappConnect` in `allowLogin`.
  - Logins resumed by `redirectToApp()` and `finishAccountSetup` after an import also land on the terminator.
  - CLI login gets the no-callback copy.
- [ ] **(D4)** `/sign`, `/sign-message` and `/verify-owner` stay fully functional, with an `AccountExportNotice` (variant `info`) above the request: "App approvals in MyNearWallet end on 1 November. Move your account to keep using {host}."
  - The notice must not move the approve or reject buttons, and must not appear on the success or error result screens.
- [ ] **Background:**
  - MNW keeps no record of connected dApps.
  - Existing function-call keys sign zero-deposit calls **locally in the dApp, without MNW**, and keep working until revoked.
  - `/authorized-apps` stays available for revoking them.

### 6.4 Staking
- [ ] **(D2) Native staking deposits:**
  - Hide the stake buttons in `Staking.js`, `Validators.js`, `ValidatorBox.js` and `Validator.js`.
  - Gate the `/staking/:validator/stake` deep links.
  - Assert `stakeDeposit` in `handleStakingAction` ([redux/actions/staking.js](packages/frontend/src/redux/actions/staking.js)) for stake, including lockup `select_staking_pool` + `deposit_and_stake`.
- [ ] **(D2) Liquid staking deposits:** hide the stake entry points in [liquid-staking/](packages/frontend/src/components/staking/liquid-staking) (`ValidatorBoxItem.tsx`, `ValidatorDetail.tsx`, `StakingForm.tsx`), and assert in `liquidStaking` ([liquidStaking.ts](packages/frontend/src/redux/actions/liquidStaking.ts)).
- [ ] Unstake, withdraw and claim farm rewards (native and liquid) **stay fully functional.**
- [ ] Staking page notice: "New staking has ended. Unstaking and withdrawing in MyNearWallet end on 1 November. Your staked NEAR stays in your account and can be managed from your new wallet. Unstaking takes about 2–3 days."

### 6.5 Account security
- [ ] Retire **Enable 2FA**: `/enable-two-factor` and the Profile entry. Assert in `deployMultisig`.
- [ ] **Interim 2FA handling** until the helper-free flow ships in Release C (§8.1):
  - **If NEAR's helper is up:** keep MNW's existing "Disable 2FA" in [TwoFactorAuth.js](packages/frontend/src/components/profile/two_factor/TwoFactorAuth.js) (never gated) and link to it from the 2FA eligibility guidance.
  - **If it is down:** hide that button, because it can only fail. The guidance then says:
    - If the user has a 12-word recovery phrase set up for this account, it still has full access and can be imported straight into Meteor.
    - Otherwise: "We're adding a way to turn off 2FA without a code. Your account and funds are safe."
    - Once the relay is hardened and the [2fa-recovery](https://github.com/Meteor-Wallet/2fa-recovery) app is hosted on an official Meteor or MNW domain, also offer: "Export key" → official recovery page.
- [ ] Seed-phrase recovery, Ledger enable/disable, key revocation: unchanged in Phase 2 (D12, D8).

### 6.6 Migration prompts throughout the wallet

| Surface | Phase 2 behaviour |
| --- | --- |
| **Sunset modal** ([SunsetNotice.tsx](packages/frontend/src/app/SunsetNotice.tsx)) | Translated. "MyNearWallet enters limited mode on 1 November: sending, staking and app approvals stop. Move your accounts now." Shown **once a day** (was every 4 days). Primary button "Migrate now"; secondary "Learn more". Never shown on dApp or export routes. |
| **Home hero banner** ([AccountExportBanner.jsx](packages/frontend/src/components/wallet/AccountExportBanner.jsx)) | Phase 2 copy naming 1 November. Primary "Migrate" (resume-aware); secondary **"Export keys"**. |
| **Global bar** (new; every logged-in page **except** home, `/export-accounts/*`, dApp routes and the unlock page) | Compact and not dismissible: "MyNearWallet enters limited mode on 1 November. [Migrate now]". **It must not make RPC calls**; it uses only the resume check from `useMigrationEntryRoute()`. |
| **Nav "Migrate"** | Replaces Explore (§6.2) |
| **Contextual notices** | Send: "Sending from MyNearWallet ends on 1 November." Receive: "Receiving through MyNearWallet ends on 1 November. Your address stays the same in your new wallet." Staking: §6.4. Sign: §6.3. |
| *Can follow:* account switcher chips and bar progress ("2 of 3 moved") | Needs `useMigrationStatus()` |

- [ ] One prompt per surface; on the home screen the hero banner replaces the bar.
- [ ] Mobile: 16px gutters; the bar wraps under 600px like the existing banner. Respect `prefers-reduced-motion`.

### 6.7 Migration flow completeness
- [ ] [AccountExportManual.jsx](packages/frontend/src/components/account-export/AccountExportManual.jsx) and `loadExportAccountSecrets` accept **any keystore account with a local key**, not just `available` ones.
- [ ] Add an **"Export keys"** secondary entry on the selection screen and the home banner.
- [ ] Label keys clearly: "Private key (starts with `ed25519:`). In your new wallet, choose *Import private key*." Add: "If you saved a 12-word recovery phrase when you created this account, it still works too."
- [ ] Write the `mnw:sunset:exported` marker.
- [ ] Give each `availability` reason a next step on [AccountExportSelect.jsx](packages/frontend/src/components/account-export/AccountExportSelect.jsx) / [AccountExportAccountList.jsx](packages/frontend/src/components/account-export/AccountExportAccountList.jsx):

| `availability` | Message | Action |
| --- | --- | --- |
| `two_factor_unsupported` | Interim copy from §6.5. Export warning: "This key can take full control of this account. Keep it as safe as a recovery phrase." | Disable 2FA (if the helper is up) / Export key / official recovery page (once hosted) |
| `ledger_unsupported` | "This account is secured by your Ledger. Connect the same Ledger in Meteor Wallet or any Ledger-compatible NEAR wallet; no key needs to move." | Ledger guide link |
| `not_funded` | "This address has never received funds, so it doesn't exist on NEAR yet. Its key still controls it if funds arrive later." | **Export key** |
| `no_local_key` | "MyNearWallet doesn't hold a key for this account in this browser. Use your original recovery phrase or device in your new wallet." | Guide link |
| `not_full_access` | "This browser's key can't control the account fully. Use your original recovery phrase in your new wallet." | Export key + guide |
| `algorithm_unsupported` | "This key type can't be transferred automatically." | Export key |
| `verification_failed` | Existing copy | **Retry** that one account |

- [ ] *Can follow:* on [AccountExportNewKeyActivated.jsx](packages/frontend/src/components/account-export/AccountExportNewKeyActivated.jsx), add "What you should see in Meteor" per account: available NEAR, staked total, lockup balance, token and NFT counts (POA step 3).
- [ ] [AccountExportRemove.jsx](packages/frontend/src/components/account-export/AccountExportRemove.jsx) stays opt-in and local-only. Its copy should repeat that the on-chain account is untouched.

### 6.8 Phase 2 safety review
Do this before the mainnet deploy, with a named reviewer for each item.

| # | Check | How |
| --- | --- | --- |
| S1 | Never-gated routes and actions work at phase 2: `/export-accounts/*`, all recover and import routes, unlock, Disable 2FA, revoking app keys, export key | Route-gating test (§9.1) + QA |
| S2 | Existing-account actions on shared routes still work: add seed phrase, add key, enable Ledger | QA with a real account on testnet |
| S3 | `checkIsNew` and import RPC or indexer failures show retry, never creation and never a false "no account" | Unit tests with mocked failures + QA with RPC blocked in devtools |
| S4 | `/login` always answers the dApp: popup, redirect, CLI, logged out, locked, `/login/` | Unit tests + QA with the [guestbook](packages/guestbook) dApp and a near-connect popup |
| S5 | `/sign`, `/sign-message`, `/verify-owner` behave **exactly** as before apart from the notice (approve, reject, success and failure callbacks) | QA with the guestbook dApp in both modes |
| S6 | Send, unstake, withdraw, claim, NFT transfer, lockup transfer and linkdrop claim to an existing account still work | QA on testnet |
| S7 | Phase 3 entries in `DISABLED_FROM` change nothing at phase 2 | Route-gating table at phase 2 |
| S8 | The global bar and banner add no per-page RPC calls | Network tab review |
| S9 | No secrets, full URLs or fragments in the new analytics events | Code review of event payloads |
| S10 | The build fails on an invalid `SUNSET_PHASE`; `''` is treated as unset; mainnet ignores `?sunset_phase` | Unit tests + a CI dry run |
| S11 | The terminator validates callback URLs (blocked protocols) and shows the host safely | Unit tests |
| S12 | Accessibility and mobile for the retired page, terminator, bar and modal | QA on iOS Safari and Android Chrome, plus keyboard |

### 6.9 Communications and external coordination
Phase 2 has been announced. Still needed for Release A:
- [ ] **Support macros (Gleap)**, live before the deploy:
  - one per ineligibility reason
  - 2FA (interim)
  - forgotten MNW password: only the original recovery phrase can restore access
  - migration-passphrase confusion
  - "why can't I create an account, swap, or connect to an app"
- [ ] **Sunset page:** check that it matches the shipped Phase 2 behaviour and names 1 November. Add the anti-phishing notice.
- [ ] **near-connect manifest PR** (remove `signIn*`) and the **wallet-selector** deprecation request (§4).
- [ ] **dApp developers:** confirm the Phase 2 announcement told them that new MNW connections are refused, and include the error codes (D5).

### 6.10 Release A checklist, deploy and rollback
- [ ] Every item in the definition of done (§6.0).
- [ ] The safety review (§6.8) is signed off.
- [ ] Jest and lint green ([§9.1](#91-unit-tests-jest)).
- [ ] The QA matrix (§9.2) has passed on testnet and on mainnet staging (real small accounts).
- [ ] The PostHog dashboard and Sentry alert are live. Support is briefed.
- [ ] **GitHub environment variables:** set `SUNSET_PHASE=2` on `mainnet`, `mainnet-staging`, `testnet` and `testnet-staging`. The committed default is also `2`.
- [ ] **Deploy:** merge to `master` (deploys both staging environments) → push to `testnet` → push to `mainnet`.
- [ ] **Verify on production:**
  - `window.mnwSunset.phase === 2`
  - `/swap` and `/create` show the retired page
  - the guestbook `/login` gets a failure back
  - `/sign` works with the notice
  - export and the Meteor transfer start
- [ ] **Note the Cloudflare deployment ID** of the last pre-Release-A deployment. That is the rollback target.
- [ ] **Rollback:** use Cloudflare Pages "rollback to previous deployment". There is no schedule or date logic, so the previous build is exactly the old behaviour. Then revert or fix on `mainnet` before the next push.
- [ ] **Stale tabs:** users with MNW already open keep the old bundle until they reload. Acceptable, because gating isn't a security boundary.

---

## 7. Release B: Phase 3 (behind the flag)

**Build the code Fri–Sat. It merges to `master` and is inert at `SUNSET_PHASE=2`. It goes live by flipping the flag in a new deployment on 1 Nov.**

### 7.1 What to build
**dApp requests**
- [ ] `/sign`, `/sign-message` and `/verify-owner` → `DappRequestRetired` (Phase 3 copy).
- [ ] Switch the existing sign cancel paths onto the shared failure helpers, which fixes the double encoding and the sign-message `success`-on-reject bug.
- [ ] Assert `dappSign` in `handleSignTransactions` ([redux/slices/sign](packages/frontend/src/redux/slices/sign)), including the private-shard branch. Assert `dappSignMessage` in the sign-message and verify-owner thunks. A failed assert in a dApp flow must answer the dApp through the helpers.

**Send, NFT, receive, linkdrop, explore**
| Capability | Wiring |
| --- | --- |
| `send` | Gate `/send-money/:accountId?`. Hide Send on the home screen and in `send/components/TabSelector.js`. Assert in `fungibleTokensService.transfer` ([FungibleTokens.js](packages/frontend/src/services/FungibleTokens.js)). |
| `nftTransfer` | Hide Transfer in [NFTDetail.js](packages/frontend/src/components/nft/NFTDetail.js); the detail page stays viewable. Assert in `NonFungibleTokens.transfer`. |
| `receive` (D6) | Gate `/receive-money` with copy: "Receiving through MyNearWallet has ended. Your account still exists on NEAR, so anything sent to it arrives on-chain and is available in whichever wallet you move to." Keep the account ID copy control. |
| `linkdropClaim` (D9) | `/linkdrop/...` shows "Claim this link with Meteor Wallet or another NEAR wallet". Assert in `claimLinkdropToAccount`. |
| `explore` | Gate `/explore`; remove `ExploreNativeBanner` from the home screen. |
| `lockupTransfer` (D7) | **Stays enabled** ([LockupAvailTransfer.js](packages/frontend/src/components/profile/balances/LockupAvailTransfer.js)). |

**Staking (`stakeManage`)**
- [ ] Hide unstake, withdraw and claim (native and liquid) and gate their deep links. The page renders its existing overview read-only, with the banner "Staking actions have ended in MyNearWallet. Your stake is safe; manage it from your new wallet."
- [ ] Assert in `handleStakingAction`, `claimFarmRewards` (which bypasses the lockup and 2FA wrappers through `getAccountBasic`), and the liquid `unstake`, `liquid_unstake` and `withdraw_all` actions.

**Account management**
- [ ] Under `addRecoveryMethod`, `manageLedger` and `removeFullAccessKey` (D8):
  - Hide the relevant actions in [Recovery/index.js](packages/frontend/src/components/profile/Recovery/index.js), [HardwareDevices/index.js](packages/frontend/src/components/profile/HardwareDevices/index.js), [FullAccessKeys.js](packages/frontend/src/components/access-keys/v2/FullAccessKeys.js) and `FullAccessKeyRotation.js`.
  - Gate `/set-recovery/*`, `/setup-seed-phrase/*`, `/setup-ledger/*` and `/setup-ledger-success`.
  - `/full-access-keys` stays viewable. **Revoking app keys** ([AuthorizedAppsKeys.js](packages/frontend/src/components/access-keys/v2/AuthorizedAppsKeys.js)), Disable 2FA (interim rules), export key, password and lockup transfer stay.
- [ ] Under `ledgerMetadataKey`, make `addWalletMetadataAccessKeyIfNeeded` (`utils/wallet.ts`) a no-op, so Ledger sign-in sends nothing on-chain. Check sign-in still lists accounts.

**Phase 3 surfaces**
- [ ] **Home ([Wallet.js](packages/frontend/src/components/wallet/Wallet.js)):**
  - Hide the action row (Send / Receive / Top Up / Swap) and the deposit, explore and custom-name banners.
  - The hero banner switches to Phase 3 copy ("MyNearWallet is now in limited mode…") with **"Migrate to Meteor"** and **"Export keys"**.
  - Balances, Collectibles and Activity stay read-only. The account ID copy control stays.
- [ ] **Nav:** Wallet · Migrate · Staking (read-only) · Account · Support. The account switcher keeps "Import account".
- [ ] **Modal and bar:** Phase 3 copy. The modal shows once per session.
- [ ] **Guest landing:** "MyNearWallet is in limited mode" + "Import existing account" + "Get Meteor Wallet".
- [ ] **Import screens:** "You don't need MyNearWallet to get into your account. Your recovery phrase or private key works directly in Meteor Wallet." Import into MNW still works underneath.
- [ ] **Translations** for every new Phase 3 string, in all locales.
- [ ] *Optional:* a reload prompt for stale tabs. Emit `version.json` at build and compare it on route change ("MyNearWallet has been updated. Reload to continue."), so tabs left open across the Phase 3 deployment don't keep Phase 2 behaviour indefinitely.

### 7.2 Readiness checklist (Saturday)
- [ ] All Release B PRs merged to `master`. **Mainnet staging and testnet staging redeployed with `SUNSET_PHASE=2` and checked to be unchanged** (invariant 8).
- [ ] **Dress rehearsal:**
  - Set `vars.SUNSET_PHASE=3` on `mainnet-staging` and `testnet`, and redeploy both through `workflow_dispatch`.
  - Run the Phase 3 QA matrix (§9.3).
  - Then rehearse the rollback: a Cloudflare rollback on testnet back to the phase 2 deployment, and confirm phase 2 behaviour returns.
- [ ] D1 (time and on-call) and D6–D9 confirmed.
- [ ] Phase 3 support macros, the sunset-page update, the near-connect "remove signing" PR and the dApp developer notice are ready to publish when the deployment happens.
- [ ] Note the Cloudflare deployment ID of the live Release A on mainnet (the Phase 3 rollback target).

### 7.3 Deployment runbook (Sun 1 Nov)
1. Confirm `mainnet` points at the commit that was QA'd on staging with `SUNSET_PHASE=3`, and that no unreviewed commits are pending.
2. Set **`vars.SUNSET_PHASE=3`** on the `testnet` and `mainnet` GitHub environments. Do **not** change the code default yet.
3. Run the testnet deploy via `workflow_dispatch`, then smoke-test it (2 minutes).
4. Run the **mainnet** deploy via `workflow_dispatch`, and watch the build log for `SUNSET_PHASE=3`.
5. **Verify on production with a real account:**
   - `window.mnwSunset.phase === 3`
   - Send, Swap and staking actions are hidden; `/send-money` shows the retired page
   - the guestbook dApp gets failures back from `/sign` and `/login` (popup and redirect)
   - export key works; the Meteor transfer starts
   - revoking an app key works; lockup transfer is visible
6. Publish the comms: sunset page, socials, near-connect PR, support macros.
7. Monitor for 2 hours, then periodically for 72 hours ([§10](#10-monitoring)).
8. Next working day: commit `SUNSET_PHASE: 3` as the default in `environmentDefaults/mainnet.ts` (and the other environments), so an unset variable can never bring Phase 2 back.

### 7.4 Rollback
- **Immediate:** Cloudflare Pages "rollback to previous deployment", to the Release A deployment noted in §7.2. This restores Phase 2 behaviour at once; no build is needed.
- **Then, straight away:** set `vars.SUNSET_PHASE=2` on `mainnet`. Otherwise the **next push to `mainnet` redeploys Phase 3.**
- **Fix forward:** a Phase 3 bug that doesn't need a full rollback is hotfixed on `master` → `mainnet` with the flag still at 3.

---

## 8. Release C: follow-ups (from Mon 2 Nov)

In priority order.

### 8.1 Helper-free 2FA disable (top priority)
2FA users are the group most at risk of being stuck once Phase 3 is live.

**How the [2fa-recovery](https://github.com/Meteor-Wallet/2fa-recovery) app works:**
- The legacy multisig contract needs 2 confirmations, counted by **signing public key**. Normally the second one comes from NEAR's helper after an SMS or email code.
- The contract's `confirm` only checks that the call comes from the account itself. When `confirm` is wrapped in a NEP-366 meta-transaction and submitted by a relayer:
  - the call comes from the user's account, so that check passes;
  - the signing key is the relayer's, so it counts as a second, different key.
- So the user's own key plus a relayer satisfy 2-of-2 with no code.

**Who it covers:**
- It supports code hash `55E7imniT2uuYrECn17qJAk9fLcwQW4ftNSwmCJL5Di` with 2 confirmations. That is **exactly the contract MNW deploys** ([src/wasm/multisig.wasm](packages/frontend/src/wasm/multisig.wasm)), so every account that turned on 2FA through MNW qualifies.
- The four older hashes in `MULTISIG_CONTRACT_HASHES` are not covered.

**Security consequence:** on these accounts, any one of the 4-method 2FA keys can take full control, with any relayer. Treat exported 2FA keys and old email/SMS recovery phrases as full-control secrets, and remove the old keys once the account is in the new wallet.

Tasks:
- [ ] **Blocked until** the relay hardening (§4) is live and the flow is validated on testnet against a real MNW-created 2FA account.
- [ ] **"Turn off 2FA" step** for `two_factor_unsupported` accounts on the supported contract. It uses the local key MNW holds and never shows it.
  1. **Preflight.** Same checks as the app's [preflight.ts](https://github.com/Meteor-Wallet/2fa-recovery/blob/main/apps/web/src/preflight.ts): code hash, `get_num_confirmations == 2`, local key has the 4 multisig methods and allowance left, and enough balance for one ~100 Tgas call plus request storage.
  2. **Build the request.** It is the same request MNW's `disable()` builds: state cleanup if needed, delete the confirm-only key, convert the 4-method keys back to full access, deploy `main.wasm`. The one change: find the confirm-only key **on-chain** (the account's function-call key limited to `['confirm']`) instead of asking the helper's `/2fa/getAccessKey`.
  3. **Submit and confirm.**
     - Submit it with `add_request_and_confirm`.
     - Sign a `confirm` meta-transaction with gas sized for the cleanup; test 300 Tgas.
     - Post it to the Meteor relay.
     - Poll until the code hash is `main.wasm` (`E8jZ1giWcVrps8PcV75ATauu6gFRkcwjNtKp7NKmipZG`) and the local key has full access.
  4. **Result.** The account is normal again, shows as `available`, and goes through the standard Meteor transfer. No code, no new phrase, no NEAR helper.
  - Copy the app's protection against ambiguous submissions: never resubmit `add_request_and_confirm` blindly; reconcile from `list_request_ids` / `get_request`.
- [ ] **Fallback if the combined request fails validation:**
  - Do what the app does: a single-AddKey request for a new key that MNW generates and stores.
  - Change eligibility so an account whose local key has full access can be transferred with the contract still deployed. Check first that Meteor handles that.
- [ ] **Bricked accounts** ([AccountLock.jsx](packages/frontend/src/components/wallet-migration/AccountLock.jsx)):
  - Mount it from the 2FA guidance when `isAccountBricked()` is true. Bricked contract state makes `add_request_and_confirm` fail, so a full-access phrase is needed.
  - Replace `disableWithFAK`'s helper lookup with the same on-chain one.
- [ ] **Unsupported contract versions:** manual export and support macro. Don't show a button that will fail.
- [ ] **Standalone app:** host it on an official domain and link it from the sunset page, FAQ and macros. It is the path for anyone who no longer has MNW, including after Phase 4.

### 8.2 Migration Hub (replaces the Phase 3 home banner)

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

- [ ] One row per keystore account: status from `useMigrationStatus()`; available, staked and lockup totals; one context action (Move / Export key / Turn off 2FA / Ledger guide / Remove from this browser).
- [ ] When everything is secured: "All your accounts are in Meteor ✓. You can remove them from this browser."
- [ ] Optional **"confirm you saved it"** step before removal after a *manual* export: the user types the last 6 characters of the key. Nothing is stored.
- [ ] **No new encrypted backup format.** Password-plus-ciphertext exports create unrecoverable cases when one half is lost (see the support ticket).

### 8.3 Read-only staking and lockup overview
- [ ] Per-validator view: staked, unstaked-pending, available to withdraw. Liquid positions from `OwnedValidators.tsx`.
- [ ] Explanations:
  - Pending unstakes: "Unstaked NEAR becomes withdrawable after about 4 epochs (2–3 days). Withdraw it from your new wallet."
  - stNEAR: "Your stNEAR is a token in your account and appears in your new wallet. Manage it at Meta Pool."
- [ ] Revisit D7 once Meteor's lockup support is confirmed.

### 8.4 Can-follow items from Release A
- [ ] `useMigrationStatus()`, bar progress and switcher chips
- [ ] The post-migration balance checklist
- [ ] Automatic activation of funded implicit accounts on the old creation routes

### 8.5 Unlock "Forgot password?" explainer
MNW can't reset the password; the original recovery phrase works in any wallet.

### 8.6 Native translation review
Review all `sunset.*` strings in the 8 non-English locales.

### 8.7 Transaction-shape guard (defence in depth)
There is **no single signing chokepoint**:
- `TransactionExecutor` only covers liquid staking and Ref swaps.
- Farm claims, `deployMultisig`, linkdrop `FundingAccount`, `disableMultisigWithFAK` and the Meteor flows all bypass the app-level wrappers.

The broadest app-level point is the **lockup decorator's** `signAndSendTransaction` ([account-with-lockup.ts](packages/frontend/src/utils/account-with-lockup.ts)), which wraps everything from `wallet.getAccount()`.

- [ ] Add a pure function `assertSunsetAllowsTransaction({ accountId, receiverId, actions, phase })`. In Phase 3 it allows only:
  1. `DeleteKey` on the user's own account.
  2. The 2FA-disable shapes: `delete_request`, and `add_request_and_confirm` carrying the §8.1 request. The relayed `confirm` is a meta-transaction signed outside the decorator.
  3. The lockup → owner transfer (D7).
- [ ] Call it in the decorator and in `transactionExecutor.ts`.
- [ ] The Meteor migration signer stays out of scope. Add a test proving it never goes through the guard.
- [ ] The guard is a no-op below Phase 3. Denials go to Sentry.

### 8.8 e2e updates (Playwright)
Make the specs in [packages/e2e-tests](packages/e2e-tests) phase-aware rather than deleting them:

| Specs | Phase 2 | Phase 3 |
| --- | --- | --- |
| `register/*`, `linkDrop/newUser` | Retired page | Retired page |
| `swap/*` | Retired | Retired |
| `loginWithDapp/*` | Terminator | Terminator |
| `signMessageWithDapp/*` | Works, with notice | Terminator |
| `stakeUnstake/*` | Stake retired, unstake works | Read-only |
| `transfer-tokens/*`, `nft/*`, `linkDrop/signedInUser` | Work | Retired |
| `recover/*` | Works | Works |

- [ ] **New spec:** `sunset/migrationAlwaysReachable.spec.js`.

### 8.9 Cleanup and Phase 4 prep
- [ ] Delete unreachable creation code, the legacy `WalletMigration` modal (after AccountLock is moved out), `CreateAccountLanding` and the swap and buy code.
- [ ] Merge the PR removing the near-connect manifest entry.

---

## 9. Test strategy

### 9.1 Unit tests (Jest)
CI runs lint and Jest on every deploy (`cloudflare-pages-deploy.yml`); Playwright is not part of CI.

**Release A:**
- [ ] **Capability model:**
  - Every capability resolves in every phase.
  - **Monotonicity:** a disabled capability stays disabled in later phases.
  - The never-gated list is absent from the type.
- [ ] **Flag parsing:**
  - `1 | 2 | 3` accepted.
  - Any other value fails.
  - `''` is treated as unset and falls back to the environment default.
  - The QA override is ignored on `mainnet` and honoured elsewhere.
- [ ] **Route gating table at phase 2:**
  - Render `App` routes in a `MemoryRouter` for every route in Appendix B and assert retired, terminator or feature.
  - Include `/login/`, and locked and logged-out states.
  - `/export-accounts/*` and the import routes render normally.
  - **No Phase 3-only route changes at phase 2.**
- [ ] **Login terminator:**
  - The popup `postMessage` payload and target origin.
  - The redirect to `failure_url`.
  - The 3-second fallback; the CLI (no callback) branch; blocked protocols refused.
- [ ] **Action asserts:** each Phase 2 assert throws `SunsetCapabilityError` at phase 2 and runs at phase 1.
- [ ] **Creation shared routes:** `checkIsNew` true → retired; false → existing-account flow; error → retry.
- [ ] **Import block:** a definite `AccountDoesNotExist` blocks; an RPC or indexer failure shows retry.
- [ ] **Manual export:** includes accounts of every `availability` that have a local key; the marker never contains key material.
- [ ] **Translations:** `sunset.*` parity across 9 locales.

**Release B adds:**
- [ ] The route gating table at phase 3.
- [ ] Terminator payloads for `/sign`, `/sign-message` and `/verify-owner`, including single encoding and `failure` status.
- [ ] Phase 3 action asserts.
- [ ] An assert inside a dApp flow produces a failure callback.

### 9.2 QA matrix: Release A (Phase 2)
Run on testnet and on mainnet staging, with real small accounts.

**Account types:**
1. Named account with a seed-phrase full-access key
2. Funded implicit account
3. Unfunded implicit account
4. Ledger account
5. 2FA account
6. Lockup with unlocked funds
7. Native stake with a pending unstake
8. Liquid staking
9. Password-protected wallet
10. Wallet with more than 30 accounts
11. Account with dApp function-call keys

**Flows:**
- **Creation is retired:** every entry point is hidden and every direct URL in Appendix B shows the retired page. Existing-account seed-phrase add, key add and Ledger enable still work. Importing a non-existent phrase is blocked; an import during an RPC outage shows retry.
- **Swap and buy retired;** the nav shows "Migrate".
- **dApps:** `/login` answers with a failure in popup mode, redirect mode, logged out, locked, as `/login/`, and from the CLI. `/sign`, `/sign-message` and `/verify-owner` work (approve and reject) with the notice.
- **Staking:** stake is retired; unstake, withdraw and claim work (native and liquid).
- **Still working:** send, NFT transfer, lockup transfer, linkdrop claim to an existing account.
- **2FA:** behaves per the interim rules for the helper's actual status.
- **Prompts:** modal (daily, never on dApp or export routes), banner, bar, contextual notices.
- **Migration:** manual export works for every account type; the Meteor transfer works end to end (start, activate, verify, resume after reload); local removal.

**Browsers and devices:** Chrome, Firefox and Safari on desktop; iOS Safari and Android Chrome, including popup mode.

### 9.3 QA matrix: Release B (Phase 3)
Run on Saturday's dress-rehearsal deployments.

- Everything retired in Phase 3 is hidden, and its direct URLs are retired.
- `/sign`, `/sign-message` and `/verify-owner` answer with failures (popup and redirect).
- Staking is read-only.
- Lockup transfer works; revoking an app key works.
- Import screens show the notice.
- Ledger sign-in sends no transaction.
- **"Must still work":**
  - export key for each account type
  - Meteor transfer end to end
  - Disable 2FA per the interim rules
  - view staking and lockup balances
  - unlock a password-protected wallet
  - import with a phrase
- **The rollback rehearsal** (§7.2).

---

## 10. Monitoring

For 72 hours after each release, watch:
- `sunset_feature_blocked`, especially `entry:'action'`. That is a missed entry point; hotfix it.
- `sunset_dapp_request_rejected` volume and hosts
- migration funnel conversion, compared with the prior week
- Sentry errors on `/export-accounts/*`
- Gleap ticket volume by macro
- the relayer's balance (once §8.1 ships)

---

## 11. Risks and mitigations

| Risk | Likelihood / impact | Mitigation |
| --- | --- | --- |
| A Phase 2 entry point is missed | Med / Low | Action asserts block it anyway; the Sentry alert and `entry:'action'` analytics find it. |
| A gate breaks an existing-account action on a shared route | Med / High | Safety review S2, unit tests on the `checkIsNew` branches, fail to retry rather than to "retired". |
| A user is told "no account found" during an RPC outage | Low / High | Block only on a definite `AccountDoesNotExist` after a successful indexer lookup (S3). |
| dApps hang or break | Med / Med | The terminator always answers (S4); `/sign` is unchanged in Phase 2 (S5); developer notice; manifest and wallet-selector deprecation. |
| **Phase 3 code leaks into Phase 2 behaviour** | Low / High | Capability model; route-gating table at phase 2 on every PR; staging check at phase 2 after the Release B merges (§7.2). |
| The Phase 3 deployment misbehaves | Med / Med | Saturday dress rehearsal; Sunday runbook with verification; Cloudflare rollback to the Release A deployment, **then reset the flag to 2** (§7.4). |
| The flag reverts to Phase 2 by accident later (unset variable) | Low / Med | Commit the default `3` after the deployment (§7.3 step 8). Treat `''` as unset (S10). |
| 2FA users stuck until §8.1 lands | High / High | Interim guidance (§6.5); full-access recovery phrases still work. §8.1 is first in Release C. Contact 2FA users directly if analytics show many. |
| NEAR's 2FA service is retired or unreliable | High / High | Helper-free disable (§8.1). Remaining exposure: older contract versions and bricked accounts without a full-access phrase. |
| The Meteor relay is abused (deposit drain, gas griefing) | High until fixed / Med | Fix today (§4). |
| Unsupported account types (Ledger, lockup) | Med / High | Guidance per reason (§6.7), manual export for every local key, D7 keeps lockup transfer. |
| Machine translations read badly | Med / Low | Native review in Release C; the copy is short and calm. |
| Phishing ("migrate your MNW wallet here") | High / High | Anti-phishing line in-app, on the sunset page and in macros; a single official path; the standalone 2FA app only on an official domain. |
| Stale tabs keep old-phase behaviour | Med / Low | Acceptable; optional reload prompt in Release B (§7.1). |

---

## 12. PR sequence

| # | PR | Release | Day | Depends on |
| --- | --- | --- | --- | --- |
| 1 | Sunset config, capability model, `SUNSET_PHASE` flag plumbing (config, CI env, `workflow_dispatch`), QA override, debug handle, PostHog property, tests | A | Thu | none |
| 2 | `SunsetGatedRoute`, `FeatureRetiredPage`, `assertSunsetCapability`, `sunset.*` i18n scaffolding, modal i18n | A | Thu | 1 |
| 3 | Shared dApp failure helpers + `DappRequestRetired`; `/login` gating; notices on `/sign`, `/sign-message`, `/verify-owner` | A | Thu | 2 |
| 4 | Account creation: routes, shared routes, CTAs, linkdrop, trial drop, asserts, import-nonexistent block, retired-page safety copy | A | Thu–Fri | 2 |
| 5 | Swap, Buy, nav "Migrate" | A | Thu | 2 |
| 6 | Staking deposits; Enable 2FA retirement; interim 2FA handling | A | Thu–Fri | 2 |
| 7 | Prompts: modal, banner, global bar, contextual notices, `useMigrationEntryRoute` | A | Thu–Fri | 1, 2 |
| 8 | Migration completeness: manual export for every local key, "Export keys" entry, eligibility guidance, exported marker | A | Thu–Fri | 2 |
| 9 | Translations in all locales; analytics events; dashboard; safety review fixes | A | Fri | 3–8 |
| — | **Release A: QA → mainnet (Fri)** | A | Fri | 1–9 |
| ext | Relay hardening (`meteor_backend_v2`), near-connect PR, support macros, sunset page | — | Thu–Fri | none |
| 10 | Phase 3 dApp terminator for the sign routes (+ bug fixes) and dApp asserts | B | Fri–Sat | 3 |
| 11 | Phase 3 wiring: send, NFT, receive, linkdrop, explore, staking actions, profile actions, Ledger metadata | B | Fri–Sat | 2 |
| 12 | Phase 3 surfaces: home, nav, modal and bar copy, guest landing, import notices, translations, optional reload prompt | B | Sat | 7, 11 |
| 13 | Phase 3 tests (route table at phase 3, terminator payloads, asserts) | B | Sat | 10–12 |
| — | **Release B: dress rehearsal (Sat) → flag flip deployment (Sun 1 Nov)** | B | Sat–Sun | 10–13 |
| 14 | Helper-free 2FA disable + AccountLock | C | Mon onward | relay hardening |
| 15 | Migration status, chips, progress, balance checklist, Migration Hub | C | Mon onward | 8 |
| 16 | Read-only staking and lockup overview | C | Mon onward | 11 |
| 17 | Transaction-shape guard | C | Mon onward | 11 |
| 18 | e2e phase-awareness, native translation review, cleanup | C | Mon onward | all |

PRs 3–8 are independent once PR 2 lands, so they can run in parallel. PRs 10–12 can run in parallel once Release A is out.

---

## Appendix A: Existing bugs found during the survey

| # | Bug | Plan |
| --- | --- | --- |
| 1 | `DISABLE_CREATE_ACCOUNT` doesn't disable creation for logged-in users, linkdrops or the funding routes | Superseded by §6.1 |
| 2 | Duplicate `/create` route in `App.js` | Delete in PR 4 |
| 3 | Withdrawing on a farming validator does `Promise.all([[...]])`, so the claims aren't awaited ([Validator.js](packages/frontend/src/components/staking/components/Validator.js)) | **Won't fix**: existing behaviour, and withdraw is retired on 1 Nov |
| 4 | The `/sign-message` popup reports a rejection as `status: 'success'` | Fixed in Release B (PR 10). Phase 2 deliberately leaves `/sign*` unchanged. |
| 5 | The `/sign` redirect double-encodes `errorMessage` (`utils/buildUrl.js`) | Fixed in Release B (PR 10) |
| 6 | Login's second-step Cancel doesn't notify the dApp. The InvalidContractId and multi-signer "return to app" buttons redirect even in popup mode. | Moot: `/login` is terminated from Phase 2, and `/sign` from Phase 3 |
| 7 | dApp routes dead-end for logged-out users and locked wallets | Fixed for `/login` in Release A; the sign routes in Release B |
| 8 | `SunsetNotice` can open over dApp popups | Fixed in Release A (§5.3) |
| 9 | `failure_url` is not URL-encoded in the invalid-contract-id redirect | Moot: skipped when `dappConnect` is off |
| 10 | `SignWrapper.js` references an undefined `DISPLAY.ACCOUNT_SELECTION` | Fix if touched in PR 10 |
| 11 | `SunsetNotice` is hard-coded English | Fixed in Release A (§5.5) |
| 12 | The bricked-2FA recovery (`AccountLock.jsx`) can't be reached and depends on the helper | §8.1 |
| 13 | `/verify-owner` drops `keyType=0` because the value is falsy | Moot from Phase 3 |
| 14 | `/sign` returns `signMeta`, but `docs/SignTransaction.md` documents `meta` | Moot |

## Appendix B: Route-by-route plan

Guards: Pub = `PublicRoute`, Pwd = `PasswordProtectedRoute`, Priv = `PrivateRoute`, Rt = `Route`. ⛔ = Feature Retired page; ⛔dApp = dApp terminator.

| Route | Guard | Phase 2 (Release A) | Phase 3 (Release B) |
| --- | --- | --- | --- |
| `/` | GuestLanding / Wallet | Guest: import-first. Wallet: banner and notices; Swap and Top Up hidden | Action row hidden; Phase 3 banner with Migrate and Export (C: Migration Hub) |
| `/set-password`, `/change-password` | Rt / Pwd | ✅ | ✅ |
| `/linkdrop/:fc/:fk` | Rt | Claim to existing account ✅; "new account" hidden | ⛔ (D9) |
| `/create`, `/create/:fc/:fk`, `/create-from/:id` | Pwd | ⛔ | ⛔ |
| `/set-recovery/:accountId/...` | Pwd | ⛔ new accounts; ✅ existing | ⛔ |
| `/set-recovery-implicit-account`, `/setup-passphrase-new-account` | Pub | ⛔ | ⛔ |
| `/setup-ledger-new-account` | Pub | Existing implicit → `/sign-in-ledger`; otherwise ⛔ | same |
| `/create-implicit-account`, `/initial-deposit` | Pub / Pwd | ⛔ (with "import your funded account" copy) | same |
| `/setup-seed-phrase/:accountId/:step` | Pwd | ⛔ new; ✅ existing | ⛔ |
| `/verify-account`, `/fund-with-existing-account`, `/fund-create-account/...` | Pwd | ⛔ | ⛔ |
| `/setup-ledger/:accountId` | Pwd | ⛔ new; ✅ existing | ⛔ |
| `/setup-ledger-success` | Priv | ✅ | ⛔ |
| `/enable-two-factor` | Priv | ⛔ | ⛔ |
| `/recover-account`, `/recover-seed-phrase`, `/recover-private-key`, `/recover-with-link/...`, `/auto-import-*`, `/sign-in-ledger` | Pwd | ✅ (non-existent accounts blocked) | ✅ + "import directly into Meteor" notice; Ledger metadata AddKey skipped |
| `/batch-import` | Pwd | ✅ | ✅ + notice |
| `/batch-ledger-export` | Pwd | ✅ (unreachable from UI) | ⛔ |
| `/export-accounts/*`, `/export-accounts/neardotcom/guide` | Pwd / special | ✅ **never gated** | ✅ **never gated** |
| `/login`, `/login/` | Priv → Rt | ⛔dApp | ⛔dApp |
| `/sign` | Priv | ⚠️ notice, otherwise unchanged (D4) | ⛔dApp |
| `/sign-message`, `/verify-owner` | Priv | ⚠️ notice, otherwise unchanged (D4) | ⛔dApp |
| `/authorized-apps` | Priv | ✅ | ✅ revoke (D8) |
| `/full-access-keys` | Priv | ✅ | 🔒 view only |
| `/send-money/:accountId?` | Priv | ⚠️ notice | ⛔ |
| `/nft-detail/:contractId/:tokenId` | Priv | ✅ | 🔒 (transfer hidden) |
| `/receive-money` | Priv | ⚠️ notice | ⛔ (D6) |
| `/buy` | Priv | ⛔ (D3) | ⛔ |
| `/swap` | Priv | ⛔ | ⛔ |
| `/profile/:accountId?` | Priv / Pwd | ✅; Enable 2FA hidden | 🔒 + export key, Disable 2FA (interim), app connections, password, lockup transfer |
| `/staking/*` | Priv | Stake ⛔; unstake, withdraw and claim ⚠️ | 🔒 overview, actions hidden (C: full overview) |
| `/liquid-staking/*` | Priv | Stake ⛔; unstake and withdraw ⚠️ | 🔒 (C: overview) |
| `/transaction-history` | Priv | ✅ | ✅ |
| `/explore` | Priv | ✅ (nav slot → Migrate) | ⛔ |
| `/connection`, `/cli-login-success`, `/terms`, `/privacy` | Rt | ✅ | ✅ |
