/**
 * Stabilization SD11/MNW-12: every locale must carry the FULL `newKeyTransfer` tree. Six keys
 * were English-only before this test existed — a missing key falls back to English silently, so
 * only an audit keeps the tree honest as copy is added.
 */
const LOCALES = ['it', 'pt', 'ru', 'tr', 'ua', 'vi', 'zh-hans', 'zh-hant'];

const flatten = (tree, prefix = '') =>
    Object.entries(tree).flatMap(([key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        return typeof value === 'object' && value !== null ? flatten(value, path) : [path];
    });

describe('newKeyTransfer locale parity', () => {
    // eslint-disable-next-line import/no-dynamic-require
    const english = require('./locales/en/translation.json').newKeyTransfer;
    const englishKeys = flatten(english).sort();

    it.each(LOCALES)('%s carries every newKeyTransfer key English has', (locale) => {
        // eslint-disable-next-line import/no-dynamic-require
        const tree = require(`./locales/${locale}/translation.json`).newKeyTransfer;
        expect(flatten(tree).sort()).toEqual(englishKeys);
    });
});
