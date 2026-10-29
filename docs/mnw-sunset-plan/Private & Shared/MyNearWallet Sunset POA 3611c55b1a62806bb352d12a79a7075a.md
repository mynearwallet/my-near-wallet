# MyNearWallet Sunset POA

---

As part of the NEAR Foundation’s strategy, MyNearWallet (“MNW”) will be gradually sunset through a phased transition process leading up to the planned deprecation date of **31 October 2026**.

The objective is to safely transition users to supported NEAR ecosystem wallets while minimizing disruption, maintaining account accessibility, and ensuring clear communication throughout.

A major consideration in designing this migration is learning from the original NEAR Wallet → MyNearWallet transition, which introduced significant friction around forced key rotation and recovery flows, resulting in support overhead and user confusion.

This transition will therefore prioritize:

- gradual migration phases,
- continued access to essential wallet functionality,
- simple and guided migration flows,
- and minimizing forced security complexity wherever possible.

Users will receive migration prompts directly within MNW and be guided through:

1. selecting a preferred wallet/platform type,
2. importing and verifying their account,
3. confirming balances and staking visibility,
4. and optionally completing a guided security upgrade / key rotation flow.

Meteor Wallet will likely be presented as the preferred migration path due to:

- continuity with MNW maintenance,
- simplified migration tooling,
- and full platform coverage across mobile, browser extension, and web.

The intention is to provide a highly guided migration experience with simplified import, verification, recovery, and optional key rotation flows, while still allowing users to manually migrate to other supported ecosystem wallets if preferred.

---

# Proposed Transition Timeline

| Phase | Timing | Wallet State | Available | Phased Out |
| --- | --- | --- | --- | --- |
| Phase 1 — Awareness & Preparation | July 2026 | Fully operational with migration messaging | All wallet functionality remains available. Users see migration notices, guides, and ecosystem communication. | None |
| Phase 2 — Migration-Focused Experience | August – September 2026 | Fully operational with active migration prompts | Existing users can access accounts, send/receive funds, unstake, and complete migration flows. Migration prompts appear throughout the wallet experience. | New wallet creation, swaps, and new wallet connections disabled. Accessing phased-out features redirects users into migration flows. |
| Phase 3 — Limited Functionality Mode | October – December 2026 | Migration and recovery-focused state | Users can log in, view balances, export recovery credentials, and complete migration flows. | Send/receive functionality, staking actions, swaps, wallet connections, and most interactive features disabled. Accessing phased-out features redirects users into migration/recovery flows. |
| Phase 4 — Sunset Recovery / Final Static State | 2027 onward *(TBD)* | Recovery-focused state transitioning into a static informational page | Limited recovery/export access, migration documentation, and support resources may remain available. | Most or all wallet functionality disabled. Final sunset behavior and recovery period to be aligned with the NEAR Foundation. |

---

# Immediate Next Steps

## Foundation Alignment

- Share and align on this phased transition proposal

## Internal Alignment

- Confirm phased feature restrictions
- Review Meteor V2 onboarding capabilities
- Align on migration and recovery flows

## Product & Design

- Design migration journey flows
- Draft migration messaging and notices
- Prepare onboarding wireframes and recovery UX
- Begin internal testing

---