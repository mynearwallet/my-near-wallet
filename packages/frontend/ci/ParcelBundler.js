const fs = require('fs');
const path = require('path');

const Bundler = require('parcel-bundler');

const Config = require('./config');

const getOutputPath = (output) => path.join(__dirname, '../dist/static', output);
const getWasmPath = (wasm) => path.join(__dirname, '../src/wasm/', wasm);
const getSSLPath = (ssl) => path.join(__dirname, '../devServerCertificates/', ssl);

class ParcelBundler {
    constructor({
        outDir = path.join(__dirname, '../dist/static'),
        entryPath = path.join(__dirname, '../src/index.html'),
        cloudflareBaseUrl = Config.CLOUDFLARE_BASE_URL,
        shouldUseCloudflare = Config.SHOULD_USE_CLOUDFLARE,
        isDebug = Config.DEBUG_BUILD,
        isRender = Config.IS_RENDER,
        isNetlify = Config.IS_NETLIFY,
        isDevelopment = Config.IS_DEVELOPMENT,
    } = {}) {
        this.entryPath = entryPath;
        this.outDir = outDir;
        this.isDebug = isDebug;
        this.isRender = isRender;
        this.isNetlify = isNetlify;
        this.isDevelopment = isDevelopment;
        this.cloudflareBaseUrl = cloudflareBaseUrl;
        this.shouldUseCloudflare = shouldUseCloudflare;

        this.debugLog('Environment', {
            isDevelopment,
            isRender,
            isNetlify
        });
    }

    debugLog(...args) {
        this.isDebug && console.log(...args);

    }

    getBaseConfig() {
        return {
            outDir: this.outDir,
            outFile: 'index.html',
            logLevel: 3, // 5 = save everything to a file, 4 = like 3, but with timestamps and additionally log http requests to dev server, 3 = log info, warnings & errors, 2 = log warnings & errors, 1 = log errors, 0 = log nothing
            watch: this.isDevelopment,
            hmr: this.isDevelopment,
            sourceMaps: true,
            detailedReport: false,
            autoInstall: true,
            minify: !this.isDevelopment,
            publicUrl: '/static/',
        };

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
                publicUrl: this.buildCloudflarePath(`/rnd/pr/${prNumber[1]}/`)
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
                        publicUrl: this.buildCloudflarePath('/ntl/staging/')
                    };
                }

                // Netlify production/mainnet is a dedicated deployment using 'stable' as the production branch
                return {
                    ...this.getBaseConfig(),
                    publicUrl: this.buildCloudflarePath('/ntl/mainnet/')
                };

            case 'branch-deploy':
                return {
                    ...this.getBaseConfig(),
                    publicUrl: this.buildCloudflarePath(`/ntl/branch/${branchName}/`)
                };
            case 'deploy-preview':
                if (primeUrl.includes('near-wallet-staging')) {
                // Netlify staging is a dedicated deployment using 'master' as the production branch
                    return {
                        ...this.getBaseConfig(),
                        publicUrl: this.buildCloudflarePath(`/ntl/previewstaging/${pullRequestId}/`)
                    };
                }

                return {
                    ...this.getBaseConfig(),
                    publicUrl: this.buildCloudflarePath(`/ntl/preview/${pullRequestId}/`)
                };
            default:
                throw new Error('Could not identify Netlify build environment');
        }
    }

    composeBundlerConfig() {
        const { isRender, isNetlify, isDevelopment } = this;

        if (isDevelopment || !this.shouldUseCloudflare) {
            return this.getBaseConfig();
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

        this.debugLog('entryPath', this.entryPath);
        this.debugLog('bundlerConfig', bundlerConfig);
        this.bundler = new Bundler(this.entryPath, bundlerConfig);
        this.bundler.on('bundled', () => {
            fs.copyFileSync(getWasmPath('multisig.wasm'), getOutputPath('multisig.wasm'));
            fs.copyFileSync(getWasmPath('main.wasm'), getOutputPath('main.wasm'));
            fs.copyFileSync(getWasmPath('state_cleanup.wasm'), getOutputPath('state_cleanup.wasm'));
        });

        return this.bundler;
    }

    async bundle() {
        const { isDevelopment } = this;

        if (isDevelopment) {
            // FIXME: Why does HMR not work with this configuration?
            // Watch mode with custom dev SSL certs
            await this.bundler.serve(undefined, {
                cert: getSSLPath('primary.crt'),
                key: getSSLPath('private.pem'),
            });
        } else {
            await this.bundler.bundle();
        }
    }
}

module.exports = ParcelBundler;
