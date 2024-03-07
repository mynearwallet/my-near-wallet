import { ENearNetwork } from '@meteorwallet/meteor-near-sdk/dist/packages/common/core/modules/blockchains/near/core/types/near_basic_types';
import { PublicKey } from 'near-api-js/lib/utils';

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

    abstract getAccountIdListFromPublicKey(
        publicKey: PublicKey | string
    ): Promise<string[]>;
    abstract getAccountFtList(accountId: string): Promise<string[]>;
}

export enum E_CoreIndexerAvailableMethods {
    getAccountIdListFromPublicKey = 'getAccountIdListFromPublicKey',
    getAccountFtList = 'getAccountFtList',
}
