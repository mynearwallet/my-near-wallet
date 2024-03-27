import { ENearNetwork } from '@meteorwallet/meteor-near-sdk/dist/packages/common/core/modules/blockchains/near/core/types/near_basic_types';
import {
    AbstractCoreIndexer,
    E_CoreIndexerAvailableMethods,
} from './indexers/AbstractCoreIndexer';
import { FastNearIndexer } from './indexers/FastNearIndexer';
import { NearblocksV1Indexer } from './indexers/NearblocksV1Indexer';
import { MintbaseIndexer } from './indexers/MintbaseIndexer';
import uniq from 'lodash.uniq';

// NOTE: We are using this adapter to abstract different type of indexers
// This class is using a singleton design
export class CoreIndexerAdapter {
    private static instance: CoreIndexerAdapter | undefined;
    private indexersInQueue: AbstractCoreIndexer[];
    private network: ENearNetwork;

    private constructor(network: ENearNetwork) {
        this.network = network;
        const indexers = [
            new FastNearIndexer(network),
            new NearblocksV1Indexer(network),
            new MintbaseIndexer(network),
        ];
        const supportedIndexers = indexers.filter((indexer) =>
            indexer.networkSupported.includes(network)
        );
        const sortedIndexers = supportedIndexers.sort((a, b) => a.priority - b.priority);
        this.indexersInQueue = sortedIndexers;
    }

    public static getInstance(network: ENearNetwork): CoreIndexerAdapter {
        if (
            !CoreIndexerAdapter.instance ||
            CoreIndexerAdapter.instance.network !== network
        ) {
            CoreIndexerAdapter.instance = new CoreIndexerAdapter(network);
        }

        return CoreIndexerAdapter.instance;
    }

    /********************************************
     *
     * Indexer methods
     *
     *******************************************/
    async getAccountFtList(accountId: string): Promise<string[]> {
        return await Promise.any(
            this.indexersInQueue
                .filter((indexer) =>
                    indexer.methodsSupported.includes(
                        E_CoreIndexerAvailableMethods.getAccountFtList
                    )
                )
                .map((indexer) => indexer.getAccountFtList(accountId))
        ).catch(() => {
            return [];
        });
    }

    async getAccountIdsFromPublicKey(publicKey: string): Promise<string[]> {
        return await Promise.any(
            this.indexersInQueue
                .filter((indexer) =>
                    indexer.methodsSupported.includes(
                        E_CoreIndexerAvailableMethods.getAccountIdListFromPublicKey
                    )
                )
                .map((indexer) => indexer.getAccountIdListFromPublicKey(publicKey))
        ).catch(() => {
            return [];
        });
    }

    fetchAccountIdsByPublicKeyFromAllIndexers(
        publicKey: string,
        waitAllIndexer?: boolean
    ): Promise<string[]> {
        return new Promise(async (masterResolve, masterReject) => {
            const promises = this.indexersInQueue.map((indexer) =>
                indexer.getAccountIdListFromPublicKey(publicKey)
            );
            const results = await Promise.allSettled(
                promises.map((promise) =>
                    promise.then((data) => {
                        if (data.length === 0) {
                            return data;
                        }

                        if (!waitAllIndexer) {
                            masterResolve(data);
                        }
                        return data;
                    })
                )
            );
            const flattenResults = results
                .map((item) => {
                    if (item.status === 'fulfilled') {
                        return item.value;
                    }
                    return [];
                })
                .flat();

            if (flattenResults.length === 0) {
                masterReject(new Error('No accounts found'));
            } else {
                masterResolve(uniq(flattenResults));
            }
        });
    }
}
