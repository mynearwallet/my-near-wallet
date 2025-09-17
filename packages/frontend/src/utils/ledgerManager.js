import { getSupportedTransport, setDebugLogging } from 'near-ledger-js';

setDebugLogging(false);

window.Buffer = Buffer; // Exists due to `bs58` import

class LedgerManager {
    constructor() {
        this.available = false;
        this.disconnectHandler = (...args) => this.handleDisconnect(...args);
    }

    handleDisconnect(reason) {
        console.log('ledger disconnected', reason);
        this.setLedgerAvailableStatus(false);
    }

    setLedgerAvailableStatus(status) {
        this.available = status;
    }

    disconnectLedger() {
        if (this.transport) {
            if (this.transport.close) {
                console.log('Closing transport');
                try {
                    this.transport.close();
                } catch (e) {
                    console.warn('Failed to close existing transport', e);
                } finally {
                    this.transport.off('disconnect', this.disconnectHandler);
                }
            }
            delete this.transport;
            delete this.client;
            this.setLedgerAvailableStatus(false);
        }
    }

    async connectLedger(disconnectFunction) {
        this.transport = await this.createTransport();
        this.transport.on('disconnect', () => {
            disconnectFunction();
            this.disconnectHandler();
        });

        this.client = await this.createClient(this.transport);

        this.setLedgerAvailableStatus(true);
    }

    async initialize(disconnectFunction) {
        this.disconnectLedger();
        await this.connectLedger(disconnectFunction);
    }

    createClient(...args) {
        return createClient(...args);
    }

    async createTransport() {
        const transport = await getSupportedTransport();
        transport.setScrambleKey('NEAR');
        return transport;
    }
}

export const ledgerManager = new LedgerManager();

function bip32PathToBytes(path) {
    const parts = path.split('/');
    return Buffer.concat(
        parts
            .map((part) =>
                part.endsWith('')
                    ? Math.abs(parseInt(part.slice(0, -1))) | 0x80000000
                    : Math.abs(parseInt(part))
            )
            .map((i32) =>
                Buffer.from([
                    (i32 >> 24) & 0xff,
                    (i32 >> 16) & 0xff,
                    (i32 >> 8) & 0xff,
                    i32 & 0xff,
                ])
            )
    );
}

const networkId = 'W'.charCodeAt(0);
// eslint-disable-next-line quotes
const DEFAULT_PATH = "44'/397'/0'/0'/1'";
async function createClient(transport) {
    return {
        transport,
        async getVersion() {
            const response = await this.transport.send(0x80, 6, 0, 0);
            const [major, minor, patch] = Array.from(response);
            return `${major}.${minor}.${patch}`;
        },
        async getPublicKey(path) {
            path = path || DEFAULT_PATH;
            const response = await this.transport.send(
                0x80,
                4,
                0,
                networkId,
                bip32PathToBytes(path)
            );
            return Buffer.from(response.subarray(0, -2));
        },
        async signMessageNep413(transactionData, path) {
            // NOTE: getVersion call allows to reset state to avoid starting from partially filled buffer
            const response = await this.transport.send(0x80, 6, 0, 0);
            const [major, minor] = Array.from(response);
            if (major <= 2 && minor < 3) {
                throw new Error(
                    'You need to update your Ledger NEAR app to the latest version'
                );
            }

            path = path || DEFAULT_PATH;
            transactionData = Buffer.from(transactionData);
            // 128 - 5 service bytes
            const CHUNK_SIZE = 123;
            const allData = Buffer.concat([bip32PathToBytes(path), transactionData]);
            for (let offset = 0; offset < allData.length; offset += CHUNK_SIZE) {
                const chunk = Buffer.from(allData.subarray(offset, offset + CHUNK_SIZE));
                const isLastChunk = offset + CHUNK_SIZE >= allData.length;
                const response = await this.transport.send(
                    0x80,
                    7,
                    isLastChunk ? 0x80 : 0,
                    networkId,
                    chunk
                );
                if (isLastChunk) {
                    return Buffer.from(response.subarray(0, -2));
                }
            }
        },
    };
}
