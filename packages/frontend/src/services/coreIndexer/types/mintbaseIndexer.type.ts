interface NftMetadata {
    description: string;
    extra: null;
    id: string;
    media: string;
    nft_contract_id: string;
    reference_blob: {
        attributes: [];
        collection: string;
        collection_id: string;
        creator_id: string;
        description: string;
        mime_type: string;
        unique_id: string;
    };
    title: string;
}

export interface NftMetadataResponse {
    nft_metadata: NftMetadata[];
}
