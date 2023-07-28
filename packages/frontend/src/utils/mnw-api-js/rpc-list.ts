import { TypedError } from '@near-js/types';

export interface RpcInfo {
    name?: string;
    url: string;
    website?: string;
}

export const rpcList: RpcInfo[] = [
    {
        name: 'NEAR',
        url: 'https://rpc.mainnet.near.org',
        website: 'https://docs.near.org/api/rpc/setup',
    },
    {
        name: 'Pagoda',
        url: 'https://near-mainnet.api.pagoda.co/rpc/v1',
        website: 'https://www.pagoda.co/console',
    },
    {
        name: '1RPC',
        url: 'https://1rpc.io/near',
        website: 'https://docs.ata.network/1rpc/introduction',
    },
    {
        name: 'All That Node',
        url: 'https://near-mainnet-rpc.allthatnode.com:3030',
        website: 'https://docs.allthatnode.com/protocols/near',
    },
    {
        name: 'ankr.com',
        url: 'https://rpc.ankr.com/near',
        website: 'https://www.ankr.com/docs/rpc-service/chains/chains-list/#near',
    },
    {
        name: 'BlockPi',
        url: 'https://public-rpc.blockpi.io/http/near',
        website: 'https://chains.blockpi.io/#/near',
    },
    {
        name: 'Gateway.fm',
        url: 'https://rpc.near.gateway.fm',
        website: 'https://gateway.fm/',
    },
    {
        name: 'GetBlock',
        url: 'https://getblock.io/nodes/near',
        website: 'https://getblock.io/nodes/near/',
    },
    {
        name: 'Infura',
        url: 'https://near-mainnet.infura.io/v3',
        website: 'https://docs.infura.io/infura/networks/near',
    },
    {
        name: 'NodeReal',
        url: 'https://nodereal.io/api-marketplace/near-rpc',
        website: 'https://nodereal.io/',
    },
    {
        name: 'NOWNodes',
        url: 'https://near.nownodes.io',
        website: 'https://nownodes.io/',
    },
    {
        name: 'OMNIA',
        url: 'https://endpoints.omniatech.io/v1/near/mainnet/public',
        website: 'https://omniatech.io/',
    },
];

export class RpcRotator {
    static readonly list: RpcInfo[] = [...rpcList];
    protected _list: RpcInfo[];

    constructor(rpcList: RpcInfo[] = RpcRotator.list) {
        this._list = [...rpcList];
    }

    next(urlToRemove?: string): RpcInfo {
        if (urlToRemove) {
            this._list = this._list.filter(
                (rpcInfo: RpcInfo) => rpcInfo.url !== urlToRemove
            );
        }

        if (this._list.length === 0) {
            throw new TypedError(
                'All RPC providers have been tried.',
                'AllProvidersTried'
            );
        }

        return this._list[0];
    }
}
