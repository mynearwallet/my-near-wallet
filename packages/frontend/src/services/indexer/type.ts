interface NearBlocksTransaction {
    actions: any[];
    actions_agg: { deposit: number };
    block: { block_height: number };
    block_timestamp: string;
    included_in_block_hash: string;
    logs: string[];
    outcomes: { status: boolean };
    outcomes_agg: { transaction_fee: number };
    predecessor_account_id: string;
    receipt_id: string;
    receiver_account_id: string;
    transaction_hash: string;
}

export interface NearBlocksTxnsResponse {
    txns: NearBlocksTransaction[];
}
