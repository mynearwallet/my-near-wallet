import { Omit } from 'lodash';

export enum TxMethodName {
    ft_transfer = 'ft_transfer',
    ft_transfer_call = 'ft_transfer_call',
    ft_resolve_transfer = 'ft_resolve_transfer',
    exchange_callback_post_withdraw = 'exchange_callback_post_withdraw',
    nft_transfer = 'nft_transfer',
    mint = 'mint',
    nft_mint = 'nft_mint',
    nft_buy = 'nft_buy',
    buy = 'buy',
    ft_mint = 'ft_mint',
    deposit_and_stake = 'deposit_and_stake',
    unstake = 'unstake',
    deploy = 'deploy',
    create_account = 'create_account',
    liquid_unstake = 'liquid_unstake',
    claim = 'claim',
    withdraw_all = 'withdraw_all',
    near_withdraw = 'near_withdraw',
}

export enum ETransactionStatus {
    success = 'success',
    fail = 'fail',
}

export enum ETxDirection {
    receive = 'receive',
    send = 'send',
    self = 'self',
    unknown = 'unknown',
}

export interface TransactionItemComponent {
    id: string;
    image: string;
    image2?: string;
    // Sent, Received, Swapped
    title: string;
    subtitle?: React.ReactNode;
    dateTime?: string;
    assetChangeText?: string;
    assetChangeText2?: string;
    status?: ETransactionStatus;
    dir?: ETxDirection;
    subCard?: TransactionItemComponent[];
    // transaction hash
    leftCaption?: string;
    hasError?: boolean;
    isNft?: boolean;
}

interface ITxAction {
    FunctionCall?: {
        args: string;
        deposit: string;
        gas: number;
        method_name: TxMethodName;
    };
    Transfer?: {
        deposit: string;
    };
}

export type IMetaData = {
    icon: string | null;
    decimals: number;
    symbol: string;
};

interface IReceipt {
    metaData?: IMetaData;
    predecessor_id: string;
    receipt: {
        Action: {
            actions: ITxAction[];
            gas_price: string;
            input_data_ids: string[];
            output_data_receivers: string[];
            signer_id: string;
            signer_public_key: string;
        };
    };
    receipt_id: string;
    receiver_id: string;
}

interface IReceiptOutcome {
    block_hash: string;
    id: string;
    outcome: {
        executor_id: string;
        gas_burnt: number;
        logs: string[];
        metadata: {
            gas_profile: {
                cost: string;
                cost_category: string;
                gas_used: string;
            }[];
            version: number;
        };
        receipt_ids: string[];
        status: {
            SuccessReceiptId?: string;
            Failure?: Object;
        };
        tokens_burnt: string;
    };
    proof: {
        direction: string;
        hash: string;
    }[];
}

export interface ITxFunctionCall {
    args: string;
    deposit: string;
    gas: number;
    method_name: TxMethodName;
}

export interface ITransaction {
    actions: {
        FunctionCall: ITxFunctionCall;
        CreateAccount?: any;
        DeployContract?: any;
        Transfer?: {
            deposit: string;
        };
        AddKey?: {
            public_key: string;
        };
        DeleteKey?: {
            public_key: string;
        };
        Delegate?: {
            delegate_action: {
                actions: Omit<ITransaction['actions'], 'Delegate'>;
                receiver_id: string;
                sender_id: string;
            };
            signature: string;
        };
        Stake?: any;
    }[];
    hash: string;
    nonce: number;
    public_key: string;
    receiver_id: string;
    signature: string;
    signer_id: string;
}

interface ITransactionOutcome {
    block_hash: string;
    id: string;
    outcome: {
        executor_id: string;
        gas_burnt: number;
        logs: string[];
        metadata: {
            gas_profile: null;
            version: number;
        };
        receipt_ids: string[];
        status: {
            SuccessReceiptId: string;
        };
        tokens_burnt: string;
    };
    proof: {
        direction: string;
        hash: string;
    }[];
}

export interface ITransactionDetail {
    receipts: IReceipt[];
    receipts_outcome: IReceiptOutcome[];
    status: {
        SuccessValue?: string;
        Failure?: Object;
    };
    transaction: ITransaction;
    transaction_outcome: ITransactionOutcome;
}

export interface ITransactionDetailResponse {
    id: number;
    jsonrpc: '2.0';
    result: ITransactionDetail;
}

export interface ITransactionListItem {
    metaData: IMetaData;
    receipts: IReceipt[];
    receipts_outcome: IReceiptOutcome[];
    status: {
        SuccessValue?: string;
        Failure?: Object;
    };
    transaction: ITransaction;
    transaction_outcome: ITransactionOutcome;
}
