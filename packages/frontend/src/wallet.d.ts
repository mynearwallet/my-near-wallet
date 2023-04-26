declare module Wallet {
    // @todo App is using different formats in different places.
    // We have to make one global format for such interfaces.
    declare interface Token {
        // * for example one place has "contractName" in the object, but not in another.
        contractName?: string;
        balance: string;
        onChainFTMetadata: FungibleTokenMetadataWithAdditionalProperties;
        fiatValueMetadata?: {
            last_updated_at: number;
            usd: number;
        };
    }

    declare interface FungibleTokenMetadata {
        spec: string;
        name: string;
        symbol: string;
        icon: string | null;
        reference: string | null;
        reference_hash: string | null;
        decimals: number;
    }

    declare interface FungibleTokenMetadataWithAdditionalProperties
        extends FungibleTokenMetadata {
        isBridged?: string;
    }

    // @todo Find or wait "near-api-js" package types
    declare interface Account {
        accountId: string;
        viewFunction: (
            contractId: string,
            method: string,
            params: { [k: string]: any }
        ) => Promise<null | {
            total: string;
            available: string;
        }>;
    }
}
