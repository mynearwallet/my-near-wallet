import { FinalExecutionOutcome } from 'near-api-js/lib/providers';

import { TxMethodName } from './constant';
import { ExecutionOutcomeWithIdView } from 'near-api-js/lib/providers/provider';

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
    args?: { [key: string]: string };
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
    id: string;
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

export interface ITransactionDetail extends FinalExecutionOutcomeView, WithReceipt {}

export interface ITransactionListItem extends FinalExecutionOutcomeView, WithReceipt {
    metaData: IMetaData;
    receipts: IReceipt[];
    block_timestamp: string;
    transaction_hash: string;
    gas_price: string;
}

export interface FinalExecutionOutcomeView extends FinalExecutionOutcome {
    status: FinalExecutionOutcome['status'];
    transaction: any;
    transaction_outcome: ExecutionOutcomeWithIdView;
    receipts_outcome: ExecutionOutcomeWithIdView[];
}
