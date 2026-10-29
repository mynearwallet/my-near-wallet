const fs = require('fs');
const path = require('path');

const Config = require('./config');
const ParcelBundler = require('./ParcelBundler');
const DIST_PATH = path.join(__dirname, '../dist');
const WASM_PATH = path.join(__dirname, '../src/wasm/');

const buildOutputPath = (filename) => {
    return path.join(DIST_PATH, filename);
};

const buildWasmSourcePath = (filename) => {
    return path.join(WASM_PATH, filename);
};

const runBundler = async () => {
    const args = process.argv
        .slice(2)
        .map((arg) => arg.replace('--', ''))
        .reduce((argMap, param) => {
            const [key, value] = param.split('=');
            argMap[key] = value;
            return argMap;
        }, {});
    console.log(
        `SUNSET_PHASE: ${
            Config.SUNSET_PHASE === undefined
                ? `not set, using the ${Config.NEAR_WALLET_ENV} default`
                : Config.SUNSET_PHASE
        }`
    );
    const bundler = new ParcelBundler(args);
    bundler.initializeBundlerInstance();

    await bundler.bundle();

    fs.copyFileSync(
        buildWasmSourcePath('multisig.wasm'),
        buildOutputPath('multisig.wasm')
    );
    fs.copyFileSync(buildWasmSourcePath('main.wasm'), buildOutputPath('main.wasm'));
    fs.copyFileSync(
        buildWasmSourcePath('state_cleanup.wasm'),
        buildOutputPath('state_cleanup.wasm')
    );
};

runBundler();
