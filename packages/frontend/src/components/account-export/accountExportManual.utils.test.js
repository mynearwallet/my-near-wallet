import { createPrivateKeyMask } from './accountExportManual.utils';

describe('createPrivateKeyMask', () => {
    it('creates a same-length, random-looking private key without exposing its value', () => {
        const privateKey = 'ed25519:6psnHr8kBMq1U9j6CkXXUMujqeWSN1PkrMoahqeiGkp4';
        const mask = createPrivateKeyMask(privateKey);

        expect(mask).toHaveLength(privateKey.length);
        expect(mask).toMatch(/^ed25519:[1-9A-HJ-NP-Za-km-z]+$/);
        expect(mask).not.toBe(privateKey);
    });

    it('returns an empty string for an unavailable key', () => {
        expect(createPrivateKeyMask()).toBe('');
    });
});
