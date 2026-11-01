import { ENearNetwork } from '@meteorwallet/meteor-near-sdk/dist/packages/common/core/modules/blockchains/near/core/types/near_basic_types';

/**
 * Thrown when an indexer answered and found nothing, as opposed to failing to answer. Callers that
 * only want a result can treat it like any other error; the tag lets the ones that must tell
 * "no accounts" from "indexer down" apart do so.
 */
export class CoreIndexerNoResultError extends Error {
    readonly noResult = true;
}

export const isCoreIndexerNoResult = (error: unknown) =>
    (error as { noResult?: boolean } | null)?.noResult === true;

export abstract class AbstractCoreIndexer {
    network: ENearNetwork;
    abstract priority: number;
    abstract networkSupported: ENearNetwork[];
    abstract methodsSupported: E_CoreIndexerAvailableMethods[];

    constructor(network: ENearNetwork) {
        this.network = network;
    }

    /****************************************************/
    /*
    /*                Abstract methods
    /*
    /****************************************************/

    abstract getAccountIdListFromPublicKey(publicKey: string): Promise<string[]>;
    abstract getAccountFtList(accountId: string): Promise<string[]>;
    abstract getAccountValidatorList(accountId: string): Promise<string[]>;
    abstract getValidatorList(): Promise<string[]>;
    abstract getAccountNfts(accountId: string): Promise<string[]>;
    abstract getNftDetailByReference(referenceid: string): {};
}

export enum E_CoreIndexerAvailableMethods {
    getAccountIdListFromPublicKey = 'getAccountIdListFromPublicKey',
    getAccountFtList = 'getAccountFtList',
    getAccountValidatorList = 'getAccountValidatorList',
    getValidatorList = 'getValidatorList',
    getAccountNfts = 'getAccountNfts',
    getNftDetailByReference = 'getNftDetailByReference',
}
