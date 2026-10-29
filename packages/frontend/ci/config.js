const envValIsSet = (envVal) => typeof envVal === 'string';

const parseBooleanFromShell = (envVal) =>
    envValIsSet(envVal) ? envVal === 'yes' || envVal === 'true' : undefined;

const NEAR_WALLET_ENV = process.env.NEAR_WALLET_ENV;

// Mirrors parseSunsetPhaseFromShell in src/config/envParsers.ts, so a bad value fails the build
// instead of shipping a bundle that throws on load. Blank means "use the environment default".
const parseSunsetPhase = (envVal) => {
    if (!envValIsSet(envVal) || envVal.trim() === '') {
        return undefined;
    }
    if (!['1', '2', '3'].includes(envVal.trim())) {
        throw new Error(`Invalid SUNSET_PHASE "${envVal}": expected 1, 2 or 3`);
    }
    return Number(envVal.trim());
};

module.exports = {
    BRANCH: process.env.BRANCH,
    CLOUDFLARE_BASE_URL: process.env.CLOUDFLARE_BASE_URL,
    CONTEXT: process.env.CONTEXT,
    DEBUG_BUILD: parseBooleanFromShell(process.env.DEBUG_BUILD) || true,
    DEPLOY_PRIME_URL: process.env.DEPLOY_PRIME_URL,
    IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
    IS_NETLIFY: parseBooleanFromShell(process.env.NETLIFY),
    IS_RENDER: parseBooleanFromShell(process.env.RENDER),
    IS_PULL_REQUEST: parseBooleanFromShell(process.env.IS_PULL_REQUEST),
    NEAR_WALLET_ENV,
    RENDER: parseBooleanFromShell(process.env.RENDER),
    RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL,
    RENDER_GIT_COMMIT: process.env.RENDER_GIT_COMMIT,
    REVIEW_ID: process.env.REVIEW_ID,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_RELEASE:
        process.env.SENTRY_RELEASE ||
        (parseBooleanFromShell(process.env.RENDER) &&
            `render:${process.env.RENDER_SERVICE_NAME}:${process.env.RENDER_GIT_BRANCH}:${process.env.RENDER_GIT_COMMIT}`),
    SHOULD_USE_CLOUDFLARE: parseBooleanFromShell(process.env.USE_CLOUDFLARE),
    SUNSET_PHASE: parseSunsetPhase(process.env.SUNSET_PHASE),
    TRAVIS: parseBooleanFromShell(process.env.TRAVIS),
};
