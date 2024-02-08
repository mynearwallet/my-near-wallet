import { FinalExecutionOutcome } from 'near-api-js/lib/providers';

import { TxMethodName } from './constant';

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
