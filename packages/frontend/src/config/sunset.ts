import { parse } from 'query-string';

import CONFIG from '.';
import ENVIRONMENT from './enviroment';

/**
 * MyNearWallet sunset phases (see PLAN-phase-2-and-3.md).
 *
 *   1: Awareness. Everything works.
 *   2: Migration-focused. Account creation, swaps, buying, new staking and new dApp connections
 *      are retired.
 *   3: Limited functionality. Only viewing, key export and migration remain.
 *
 * The phase is a BUILD flag (`SUNSET_PHASE`, defaulted per environment in
 * `environmentDefaults/*`). Nothing here depends on the date, so every phase change is a
 * deployment and rolling one back is a Cloudflare rollback.
 */
export type SunsetPhase = 1 | 2 | 3;

/**
 * Everything the sunset can retire. Deliberately absent, because they must never be gated:
 * migration (`/export-accounts/*`), key export, disabling 2FA, revoking app keys, and logging in,
 * importing or unlocking. Keeping them off this list means they cannot be gated by mistake.
 */
export type SunsetCapability =
    | 'createAccount'
    | 'importNonExistentAccount'
    | 'swap'
    | 'buy'
    | 'explore'
    | 'dappConnect'
    | 'dappSign'
    | 'dappSignMessage'
    | 'send'
    | 'nftTransfer'
    | 'receive'
    | 'linkdropClaim'
    | 'stakeDeposit'
    | 'stakeManage'
    | 'lockupTransfer'
    | 'enableTwoFactor'
    | 'addRecoveryMethod'
    | 'manageLedger'
    | 'removeFullAccessKey'
    | 'ledgerMetadataKey';

/**
 * The phase each capability is retired FROM. A capability is available in every phase below
 * that number and retired in it and every phase above, so nothing retired can come back, and
 * entries for a phase above the current build are inert. `null` means never retired.
 */
export const SUNSET_DISABLED_FROM: Readonly<
    Record<SunsetCapability, SunsetPhase | null>
> = Object.freeze({
    createAccount: 2,
    importNonExistentAccount: 2,
    swap: 2,
    buy: 2,
    dappConnect: 2,
    stakeDeposit: 2,
    enableTwoFactor: 2,
    explore: 3,
    dappSign: 3,
    dappSignMessage: 3,
    send: 3,
    nftTransfer: 3,
    receive: 3,
    linkdropClaim: 3,
    stakeManage: 3,
    addRecoveryMethod: 3,
    manageLedger: 3,
    removeFullAccessKey: 3,
    ledgerMetadataKey: 3,
    // Moves lockup funds into the user's own account, which can then be migrated. Kept until
    // Meteor is confirmed to support lockup accounts.
    lockupTransfer: null,
});

/** Copy only: the date Phase 3 is announced for. Never used to decide behaviour. */
export const SUNSET_PHASE_3_DATE = '2026-11-01';

export const SUNSET_LEARN_MORE_URL = 'https://www.mynearwallet.com/sunset';

export const isSunsetPhase = (value: unknown): value is SunsetPhase =>
    value === 1 || value === 2 || value === 3;

const QA_OVERRIDE_PARAM = 'sunset_phase';
const QA_OVERRIDE_STORAGE_KEY = 'mnw:sunset:qaPhase';

/** Production mainnet always runs exactly the phase it was built with. */
export const isSunsetQaOverrideAllowed = (nearWalletEnv: string) =>
    nearWalletEnv !== ENVIRONMENT.MAINNET;

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/**
 * Resolve the phase this page runs in: the build phase, unless a non-mainnet build carries a QA
 * override (`?sunset_phase=N`, remembered for the browser session; `?sunset_phase=` clears it).
 */
export const resolveSunsetPhase = ({
    buildPhase,
    nearWalletEnv,
    search = '',
    storage,
}: {
    buildPhase: unknown;
    nearWalletEnv: string;
    search?: string;
    storage?: StorageLike;
}): { phase: SunsetPhase; buildPhase: SunsetPhase; source: 'build' | 'qa-override' } => {
    if (!isSunsetPhase(buildPhase)) {
        throw new Error(`Invalid SUNSET_PHASE "${buildPhase}": expected 1, 2 or 3`);
    }

    if (!isSunsetQaOverrideAllowed(nearWalletEnv)) {
        return { phase: buildPhase, buildPhase, source: 'build' };
    }

    let override: string | null = null;
    try {
        const params = parse(search);
        if (QA_OVERRIDE_PARAM in params) {
            const requested = params[QA_OVERRIDE_PARAM];
            if (typeof requested === 'string' && isSunsetPhase(Number(requested))) {
                storage?.setItem(QA_OVERRIDE_STORAGE_KEY, requested);
            } else {
                storage?.removeItem(QA_OVERRIDE_STORAGE_KEY);
            }
        }
        override = storage?.getItem(QA_OVERRIDE_STORAGE_KEY) ?? null;
    } catch {
        // Storage can be unavailable (private mode); fall back to the build phase.
    }

    const overridePhase = Number(override);
    return isSunsetPhase(overridePhase)
        ? { phase: overridePhase, buildPhase, source: 'qa-override' }
        : { phase: buildPhase, buildPhase, source: 'build' };
};

const resolved = resolveSunsetPhase({
    buildPhase: CONFIG.SUNSET_PHASE,
    nearWalletEnv: CONFIG.NEAR_WALLET_ENV,
    search: typeof window === 'undefined' ? '' : window.location.search,
    storage: typeof window === 'undefined' ? undefined : window.sessionStorage,
});

export const SUNSET_PHASE: SunsetPhase = resolved.phase;
export const SUNSET_PHASE_SOURCE = resolved.source;

if (typeof window !== 'undefined') {
    // Read-only handle so support and the deployment runbook can confirm what is live.
    Object.defineProperty(window, 'mnwSunset', {
        value: Object.freeze({ ...resolved }),
        configurable: true,
    });
}

export const isSunsetCapabilityEnabled = (
    capability: SunsetCapability,
    phase: SunsetPhase = SUNSET_PHASE
) => {
    const disabledFrom = SUNSET_DISABLED_FROM[capability];
    return disabledFrom === null || phase < disabledFrom;
};

/**
 * Thrown by the action-layer guard. `type` and `messageCode` plug into the existing alert
 * handling, which translates `reduxActions.SunsetCapabilityRetired`.
 */
export class SunsetCapabilityError extends Error {
    readonly capability: SunsetCapability;
    readonly type = 'SunsetCapabilityRetired';
    readonly messageCode = 'reduxActions.SunsetCapabilityRetired';

    constructor(capability: SunsetCapability) {
        super(
            'This is no longer available in MyNearWallet. Please move your account to a supported wallet.'
        );
        this.name = 'SunsetCapabilityError';
        this.capability = capability;
    }
}

export const isSunsetCapabilityError = (error: unknown): error is SunsetCapabilityError =>
    error instanceof SunsetCapabilityError ||
    (error as { type?: string } | null)?.type === 'SunsetCapabilityRetired';

/**
 * The action-layer guard. Call it first in any thunk or service that starts a retired action,
 * so a missed UI entry point still cannot start it.
 */
export const assertSunsetCapability = (
    capability: SunsetCapability,
    phase: SunsetPhase = SUNSET_PHASE
) => {
    if (!isSunsetCapabilityEnabled(capability, phase)) {
        throw new SunsetCapabilityError(capability);
    }
};
