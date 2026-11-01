import { describe, expect, it, jest } from '@jest/globals';

import { parseSunsetPhaseFromShell } from './envParsers';

jest.mock('./index', () => ({
    __esModule: true,
    default: { SUNSET_PHASE: 2, NEAR_WALLET_ENV: 'testnet' },
}));

// eslint-disable-next-line import/first
import {
    assertSunsetCapability,
    isSunsetCapabilityEnabled,
    isSunsetCapabilityError,
    resolveSunsetPhase,
    SUNSET_DISABLED_FROM,
    SunsetCapability,
    SunsetCapabilityError,
} from './sunset';

const memoryStorage = () => {
    const values = new Map<string, string>();
    return {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => void values.set(key, value),
        removeItem: (key: string) => void values.delete(key),
    };
};

const capabilities = Object.keys(SUNSET_DISABLED_FROM) as SunsetCapability[];

describe('sunset capability model', () => {
    it('resolves every capability in every phase', () => {
        for (const capability of capabilities) {
            for (const phase of [1, 2, 3] as const) {
                expect(typeof isSunsetCapabilityEnabled(capability, phase)).toBe(
                    'boolean'
                );
            }
        }
    });

    it('never brings a retired capability back in a later phase', () => {
        for (const capability of capabilities) {
            if (!isSunsetCapabilityEnabled(capability, 2)) {
                expect(isSunsetCapabilityEnabled(capability, 3)).toBe(false);
            }
            if (!isSunsetCapabilityEnabled(capability, 1)) {
                expect(isSunsetCapabilityEnabled(capability, 2)).toBe(false);
            }
        }
    });

    it('keeps everything available in phase 1', () => {
        expect(capabilities.filter((c) => !isSunsetCapabilityEnabled(c, 1))).toEqual([]);
    });

    it('retires exactly the phase 2 set in phase 2', () => {
        expect(
            capabilities.filter((c) => !isSunsetCapabilityEnabled(c, 2)).sort()
        ).toEqual(
            [
                'buy',
                'createAccount',
                'dappConnect',
                'enableTwoFactor',
                'importNonExistentAccount',
                'stakeDeposit',
                'swap',
            ].sort()
        );
    });

    it('retires everything but the lockup transfer in phase 3', () => {
        expect(capabilities.filter((c) => isSunsetCapabilityEnabled(c, 3))).toEqual([
            'lockupTransfer',
        ]);
    });

    it('keeps phase 3-only capabilities available in phase 2', () => {
        for (const capability of [
            'send',
            'dappSign',
            'dappSignMessage',
            'stakeManage',
            'receive',
            'nftTransfer',
            'linkdropClaim',
            'explore',
            'addRecoveryMethod',
            'manageLedger',
            'removeFullAccessKey',
            'ledgerMetadataKey',
        ] as SunsetCapability[]) {
            expect(isSunsetCapabilityEnabled(capability, 2)).toBe(true);
            expect(isSunsetCapabilityEnabled(capability, 3)).toBe(false);
        }
    });

    it('never retires the lockup transfer into the user’s own account', () => {
        expect(isSunsetCapabilityEnabled('lockupTransfer', 3)).toBe(true);
    });

    it('throws a recognisable error from the action-layer assert', () => {
        expect(() => assertSunsetCapability('swap', 1)).not.toThrow();
        let thrown: unknown;
        try {
            assertSunsetCapability('swap', 2);
        } catch (error) {
            thrown = error;
        }
        expect(thrown).toBeInstanceOf(SunsetCapabilityError);
        expect(isSunsetCapabilityError(thrown)).toBe(true);
        expect((thrown as SunsetCapabilityError).capability).toBe('swap');
        expect(isSunsetCapabilityError(new Error('other'))).toBe(false);
    });
});

describe('SUNSET_PHASE build flag', () => {
    it('accepts 1, 2 and 3', () => {
        expect(parseSunsetPhaseFromShell('1')).toBe(1);
        expect(parseSunsetPhaseFromShell(' 2 ')).toBe(2);
        expect(parseSunsetPhaseFromShell('3')).toBe(3);
    });

    it('treats unset and blank (GitHub passes "" for a missing var) as unset', () => {
        expect(parseSunsetPhaseFromShell(undefined)).toBeUndefined();
        expect(parseSunsetPhaseFromShell('')).toBeUndefined();
        expect(parseSunsetPhaseFromShell('  ')).toBeUndefined();
    });

    it('rejects anything else', () => {
        for (const value of ['0', '4', '2.5', 'two', 'phase3']) {
            expect(() => parseSunsetPhaseFromShell(value)).toThrow(/SUNSET_PHASE/);
        }
    });
});

describe('resolveSunsetPhase', () => {
    it('uses the build phase by default', () => {
        expect(
            resolveSunsetPhase({
                buildPhase: 2,
                nearWalletEnv: 'testnet',
                storage: memoryStorage(),
            })
        ).toEqual({ phase: 2, buildPhase: 2, source: 'build' });
    });

    it('rejects an invalid build phase', () => {
        expect(() =>
            resolveSunsetPhase({ buildPhase: 7, nearWalletEnv: 'testnet' })
        ).toThrow();
    });

    it('honours and remembers the QA override outside mainnet', () => {
        const storage = memoryStorage();
        expect(
            resolveSunsetPhase({
                buildPhase: 2,
                nearWalletEnv: 'mainnet_STAGING',
                search: '?sunset_phase=3',
                storage,
            })
        ).toEqual({ phase: 3, buildPhase: 2, source: 'qa-override' });
        expect(
            resolveSunsetPhase({
                buildPhase: 2,
                nearWalletEnv: 'mainnet_STAGING',
                storage,
            }).phase
        ).toBe(3);
        expect(
            resolveSunsetPhase({
                buildPhase: 2,
                nearWalletEnv: 'mainnet_STAGING',
                search: '?sunset_phase=',
                storage,
            })
        ).toEqual({ phase: 2, buildPhase: 2, source: 'build' });
    });

    it('ignores invalid override values', () => {
        expect(
            resolveSunsetPhase({
                buildPhase: 2,
                nearWalletEnv: 'testnet',
                search: '?sunset_phase=9',
                storage: memoryStorage(),
            }).phase
        ).toBe(2);
    });

    it('ignores the QA override on production mainnet', () => {
        const storage = memoryStorage();
        storage.setItem('mnw:sunset:qaPhase', '1');
        expect(
            resolveSunsetPhase({
                buildPhase: 2,
                nearWalletEnv: 'mainnet',
                search: '?sunset_phase=1',
                storage,
            })
        ).toEqual({ phase: 2, buildPhase: 2, source: 'build' });
    });
});
