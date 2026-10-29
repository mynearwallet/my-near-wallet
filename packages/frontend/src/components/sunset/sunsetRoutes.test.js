import {
    hasOwnSunsetNotice,
    isSunsetPromptFreePath,
    normalizePathname,
} from './sunsetRoutes';

describe('sunset prompt placement', () => {
    it('normalizes slashes', () => {
        expect(normalizePathname('//login/')).toBe('/login');
        expect(normalizePathname('')).toBe('/');
    });

    it.each([
        '/login',
        '/login/',
        '/sign',
        '/sign-message',
        '/verify-owner',
        '/cli-login-success',
        '/export-accounts/select',
        '/export-accounts/new-key-activation',
    ])('keeps prompts off %s', (path) => {
        expect(isSunsetPromptFreePath(path)).toBe(true);
    });

    it.each(['/', '/profile', '/send-money', '/signup', '/sign-in-ledger', '/staking'])(
        'allows prompts on %s',
        (path) => {
            expect(isSunsetPromptFreePath(path)).toBe(false);
        }
    );

    it('knows which pages carry their own notice', () => {
        expect(hasOwnSunsetNotice('/staking/validator.near')).toBe(true);
        expect(hasOwnSunsetNotice('/liquid-staking/meta-pool.near')).toBe(true);
        expect(hasOwnSunsetNotice('/send-money')).toBe(false);
    });
});
