import { FinalExecutionOutcome } from 'near-api-js/lib/providers';

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
    transactionHash?: string;
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

export interface ITxFunctionCall {
    args: string;
    deposit: string;
    gas: number;
    method_name: TxMethodName;
}

interface WithReceipt {
    receipts: IReceipt[];
}

export interface ITransactionDetail extends FinalExecutionOutcome, WithReceipt {}

export interface ITransactionListItem extends FinalExecutionOutcome, WithReceipt {
    metaData: IMetaData;
    receipts: IReceipt[];
}
