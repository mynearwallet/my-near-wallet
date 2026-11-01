// Pages where sunset prompts must stay out of the way: dApp requests (often popups, where the
// request itself must keep the user's attention) and the migration flow they point to.
const PROMPT_FREE_PREFIXES = [
    '/login',
    '/sign',
    '/sign-message',
    '/verify-owner',
    '/cli-login-success',
    '/export-accounts',
];

export const normalizePathname = (pathname = '') =>
    `/${pathname.split('/').filter(Boolean).join('/')}`;

// Pages that carry their own, more specific sunset notice, so the global bar would only repeat it.
const OWN_NOTICE_PREFIXES = ['/staking', '/liquid-staking'];

// Ways into MyNearWallet. They keep working, but in limited mode the user is better served by
// taking the same phrase, key or device straight to their new wallet.
const IMPORT_PREFIXES = [
    '/recover-account',
    '/recover-seed-phrase',
    '/recover-with-link',
    '/recover-private-key',
    '/auto-import-seed-phrase',
    '/auto-import-secret-key',
    '/sign-in-ledger',
    '/batch-import',
];

const matchesPrefix = (path, prefixes) =>
    prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

export const hasOwnSunsetNotice = (pathname) =>
    matchesPrefix(normalizePathname(pathname), OWN_NOTICE_PREFIXES);

export const isSunsetImportPath = (pathname) =>
    matchesPrefix(normalizePathname(pathname), IMPORT_PREFIXES);

export const isSunsetPromptFreePath = (pathname) => {
    return matchesPrefix(normalizePathname(pathname), PROMPT_FREE_PREFIXES);
};
