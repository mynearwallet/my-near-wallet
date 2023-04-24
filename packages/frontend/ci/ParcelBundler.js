const path = require('path');

const ParcelCore = require('@parcel/core');

const { default: Parcel } = ParcelCore;
const Config = require('./config');

const DIST_PATH = path.join(__dirname, '../dist');
const CACHE_PATH = path.join(__dirname, '../.parcel-cache');
const ENTRY_FILE_PATH = path.join(__dirname, '../src/index.html');
const SSL_PATH = path.join(__dirname, '../devServerCertificates/');

const enableDebugLogging = Config.DEBUG_BUILD;

class ParcelBundler {
    constructor({
        distDir = DIST_PATH,
        entries = ENTRY_FILE_PATH,
        sslPath = SSL_PATH,
        cloudflareBaseUrl = Config.CLOUDFLARE_BASE_URL,
        shouldUseCloudflare = Config.SHOULD_USE_CLOUDFLARE,
        isDebug = enableDebugLogging,
        isRender = Config.IS_RENDER,
        isNetlify = Config.IS_NETLIFY,
        isDevelopment = Config.IS_DEVELOPMENT,
    } = {}) {
        this.entries = entries;
        this.distDir = distDir;
        this.sslPath = sslPath;
        this.isDebug = isDebug;
        this.isRender = isRender;
        this.isNetlify = isNetlify;
        this.isDevelopment = isDevelopment;
        this.cloudflareBaseUrl = cloudflareBaseUrl;
        this.shouldUseCloudflare = shouldUseCloudflare;
        this.debugLog('Environment', {
            isDevelopment,
            isRender,
            isNetlify,
        });
    }
    debugLog(...args) {
        this.isDebug && console.log(...args);
    }

    getBaseConfig() {
        return {
            logLevel: 3, // 5 = save everything to a file, 4 = like 3, but with timestamps and additionally log http requests to dev server, 3 = log info, warnings & errors, 2 = log warnings & errors, 1 = log errors, 0 = log nothing
            shouldAutoInstall: true,
            mode: this.isDevelopment ? 'development' : 'production',
            detailedReport: false,
            defaultConfig: '@parcel/config-default',
            cacheDir: CACHE_PATH,
            defaultTargetOptions: {
                shouldOptimize: !this.isDevelopment,
                distDir: this.distDir,
                sourceMaps: true,
            }
        };
    }

    buildSslPath(filename) {
        return path.join(this.sslPath, filename);
    }
    buildCloudflarePath(path) {
        return new URL(path, this.cloudflareBaseUrl).toString();
    }
    composeRenderBuildConfig() {
        const isPullRequestPreview = Config.IS_PULL_REQUEST;
        const isTestnet = !isPullRequestPreview;
        const externalUrl = Config.RENDER_EXTERNAL_URL;
        this.debugLog('Render Environment', {
            isPullRequestPreview,
            isTestnet,
            externalUrl,
        });
        if (isPullRequestPreview) {
            const prNumberRegex = new RegExp(/^http[s]?:\/\/near-wallet-pr-(\d+)\.onrender\.com/g);
            const prNumber = prNumberRegex.exec(externalUrl);
            if (!prNumber) {
                throw new Error(`Could not identify PR number from externalURL: ${externalUrl}`);
            }

            return {
                ...this.getBaseConfig(),
                defaultTargetOption: {
                    ...this.getBaseConfig().defaultTargetOption,
                    publicUrl: this.buildCloudflarePath(`/rnd/pr/${prNumber[1]}/`),
                }
            };
        }

        return {
            ...this.getBaseConfig(),
            // FIXME: Re-enable once we have figured out render.com SSL problems with `wallet.testnet.near.org`?
            // publicUrl: this.buildCloudflarePath('/rnd/testnet/')
        };
    }
    composeNetlifyBuildConfig() {
        const buildContext = Config.CONTEXT; // production | deploy-preview | branch-deploy
        const primeUrl = Config.DEPLOY_PRIME_URL;
        const pullRequestId = Config.REVIEW_ID;
        const branchName = Config.BRANCH;
        this.debugLog('Netlify Environment', {
            buildContext,
            primeUrl,
            branchName,
            pullRequestId,
        });
        switch (buildContext) {
            case 'production':
                if (primeUrl.includes('near-wallet-staging')) {
                    // Netlify staging is a dedicated deployment using 'master' as the production branch
                    return {
                        ...this.getBaseConfig(),
                        defaultTargetOption: {
                            ...this.getBaseConfig().defaultTargetOption,
                            publicUrl: this.buildCloudflarePath('/ntl/staging/'),
                        }
                    };

                }

                // Netlify production/mainnet is a dedicated deployment using 'stable' as the production branch
                return {
                    ...this.getBaseConfig(),
                    defaultTargetOption: {
                        ...this.getBaseConfig().defaultTargetOption,
                        publicUrl: this.buildCloudflarePath('/ntl/mainnet/'),
                    }
                };

            case 'branch-deploy':
                return {
                    ...this.getBaseConfig(),
                    defaultTargetOption: {
                        ...this.getBaseConfig().defaultTargetOption,
                        publicUrl: this.buildCloudflarePath(`/ntl/branch/${branchName}/`),
                    }
                };
            case 'deploy-preview':
                if (primeUrl.includes('near-wallet-staging')) {
                    // Netlify staging is a dedicated deployment using 'master' as the production branch
                    return {
                        ...this.getBaseConfig(),
                        defaultTargetOption: {
                            ...this.getBaseConfig().defaultTargetOption,
                            publicUrl: this.buildCloudflarePath(`/ntl/previewstaging/${pullRequestId}/`),
                        }
                    };
                }

                return {
                    ...this.getBaseConfig(),
                    defaultTargetOption: {
                        ...this.getBaseConfig().defaultTargetOption,
                        publicUrl: this.buildCloudflarePath(`/ntl/preview/${pullRequestId}/`),
                    }
                };
            default:
                throw new Error('Could not identify Netlify build environment');
        }
    }
    composeBundlerConfig() {
        const { isRender, isNetlify, isDevelopment } = this;
        if (isDevelopment || !this.shouldUseCloudflare) {
            return { ...this.getBaseConfig(), publicUrl: '/' };
        }
        if (isNetlify) {
            return this.composeNetlifyBuildConfig(this.baseConfig);
        }
        if (isRender) {
            return this.composeRenderBuildConfig(this.baseConfig);
        }
        console.error('Could not identify build environment', { isRender, isNetlify, isDevelopment });
        throw new Error('Unknown environment for build');
    }
    initializeBundlerInstance() {
        const bundlerConfig = this.composeBundlerConfig();

        this.debugLog('entries', this.entries);
        this.debugLog('bundlerConfig', bundlerConfig);
        this.bundler = new Parcel({...bundlerConfig, entries: this.entries});

        return this.bundler;
    }
    async bundle() {
        const { isDevelopment } = this;
        if (isDevelopment) {
            // FIXME: Why does HMR not work with this configuration?
            // Watch mode with custom dev SSL certs
            await this.bundler.serve(undefined, {
                cert: this.buildSslPath('primary.crt'),
                key: this.buildSslPath('private.pem'),
            });
        } else {
            await this.bundler.run();
        }
    }
}
module.exports = ParcelBundler;
