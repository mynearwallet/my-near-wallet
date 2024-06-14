import { ENearNetwork } from '@meteorwallet/meteor-near-sdk/dist/packages/common/core/modules/blockchains/near/core/types/near_basic_types';
import {
    AbstractCoreIndexer,
    E_CoreIndexerAvailableMethods,
} from './AbstractCoreIndexer';
import { accountsByPublicKey } from '@mintbase-js/data';
import { Network } from '@mintbase-js/sdk';
import { GraphQLClient, gql } from 'graphql-request';
import { NftDetail } from '../types/coreIndexer.type';
import { NftMetadataResponse } from '../types/mintbaseIndexer.type';

export class MintbaseIndexer extends AbstractCoreIndexer {
    networkSupported = [ENearNetwork.mainnet, ENearNetwork.testnet];
    priority = 3;
    methodsSupported = [
        E_CoreIndexerAvailableMethods.getAccountIdListFromPublicKey,
        E_CoreIndexerAvailableMethods.getNftDetailByReference,
    ];
    gqlClient = new GraphQLClient(this.getBaseUrl(), {
        headers: {
            'content-type': 'application/json',
            'mb-api-key': 'anon',
        },
    });

    protected getBaseUrl(): string {
        return this.network === ENearNetwork.mainnet
            ? 'https://graph.mintbase.xyz/mainnet'
            : 'https://graph.mintbase.xyz/testnet';
    }

    getAccountFtList(): Promise<string[]> {
        return Promise.resolve([]);
    }

    async getAccountIdListFromPublicKey(publicKey: string): Promise<string[]> {
        const { data, error } = await accountsByPublicKey(
            publicKey,
            this.network as Network
        );
        if (error || !data || data.length === 0) {
            console.error(error);
            throw new Error(
                `Error: FastNear failed to capture account fungible token list for account id: ${publicKey}`
            );
        }
        return data;
    }

    getAccountValidatorList(): Promise<string[]> {
        return Promise.resolve([]);
    }

    async getValidatorList(): Promise<string[]> {
        return [];
    }

    async getAccountNfts(): Promise<string[]> {
        return [];
    }

    async getNftDetailByReference(referenceId: string): Promise<NftDetail> {
        const res = await this.gqlClient.request<NftMetadataResponse>(
            gql`
                query MyQuery($referenceId: String!) {
                    nft_metadata(where: { reference: { _eq: $referenceId } }) {
                        id
                        media
                        reference_blob
                        extra
                        description
                        nft_contract_id
                        title
                    }
                }
            `,
            { referenceId }
        );
        const meta = res.nft_metadata[0];
        return {
            ...meta,
            ...meta.reference_blob,
        };
    }
}
