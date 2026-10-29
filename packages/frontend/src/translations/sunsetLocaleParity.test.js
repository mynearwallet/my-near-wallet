/**
 * Every locale must carry the full `sunset` tree with the same interpolation placeholders. A
 * missing key falls back to English silently, and a dropped `{{date}}` or `{{host}}` would show
 * users a sentence with a hole in it.
 */
const LOCALES = ['it', 'pt', 'ru', 'tr', 'ua', 'vi', 'zh-hans', 'zh-hant'];

const flatten = (tree, prefix = '') =>
    Object.entries(tree).reduce((flat, [key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        return typeof value === 'object' && value !== null
            ? { ...flat, ...flatten(value, path) }
            : { ...flat, [path]: value };
    }, {});

const placeholders = (text) => (text.match(/\{\{\w+\}\}/g) || []).sort();

// eslint-disable-next-line import/no-dynamic-require
const load = (locale) => require(`./locales/${locale}/translation.json`);

describe('sunset locale parity', () => {
    const english = load('en');
    const englishSunset = flatten(english.sunset);

    it.each(LOCALES)('%s carries every sunset key with the same placeholders', (locale) => {
        const translation = load(locale);
        const sunset = flatten(translation.sunset);
        expect(Object.keys(sunset).sort()).toEqual(Object.keys(englishSunset).sort());
        Object.entries(englishSunset).forEach(([key, text]) => {
            expect([key, placeholders(sunset[key])]).toEqual([key, placeholders(text)]);
            expect(sunset[key].trim()).not.toBe('');
        });
        expect(typeof translation.reduxActions.SunsetCapabilityRetired).toBe('string');
    });

    it('has retired-page copy for every capability Release A retires with a page', () => {
        ['createAccount', 'swap', 'buy', 'stakeDeposit', 'enableTwoFactor'].forEach(
            (capability) => {
                expect(englishSunset[`retired.${capability}.title`]).toBeTruthy();
                expect(englishSunset[`retired.${capability}.hint`]).toBeTruthy();
            }
        );
    });
});
