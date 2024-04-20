import { ENearNetwork } from '@meteorwallet/meteor-near-sdk/dist/packages/common/core/modules/blockchains/near/core/types/near_basic_types';
import { FinalExecutionStatusBasic } from 'near-api-js/lib/providers';
import { ExecutionStatus } from 'near-api-js/lib/providers/provider';

import {
    ETxActionKind,
    ETxActionKindTextMap,
    TxMethodName,
    methodNameShowlist,
    nearMetadata,
} from './constant';
import {
    ETransactionStatus,
    ETxDirection,
    IMetaData,
    TransactionItemComponent,
    ITransactionListItem,
    ITxFunctionCall,
} from './type';
import { IpfsCacheApi, getMeteorPointsContractId } from './utils';
import imgAppInteraction from '../../../images/tx-app-interaction.png';
import imgBatch from '../../../images/tx-batch.png';
import imgClaim from '../../../images/tx-claim.png';
import imgDeploy from '../../../images/tx-deploy.png';
import imgKeyDelete from '../../../images/tx-key-delete.png';
import imgKey from '../../../images/tx-key.png';
import imgStaked from '../../../images/tx-staked.png';
import imgSwap from '../../../images/tx-swap.png';
import imgUnStaked from '../../../images/tx-unstaked.png';
import { formatTokenAmount, removeTrailingZeros } from '../../../utils/amounts';

interface TxPattern {
    match: (data: TxData, network: ENearNetwork) => boolean;
    display: (
        data: TxData,
        accountId: string,
        network: ENearNetwork
    ) => TransactionItemComponent;
}

type TxData = ITransactionListItem & {
    block_timestamp: string;
    metaData: IMetaData;
};

const txUtils = {
    getPrimaryReceipt(data: TxData) {
        const primaryReceiptId = (
            data.transaction_outcome.outcome.status as ExecutionStatus
        ).SuccessReceiptId;
        const primaryReceipt = data.receipts.find(
            (item) => item.receipt_id === primaryReceiptId
        );
        return primaryReceipt;
    },
    getFcArgs(data: TxData) {
        const args = this.decodeArgs(data.transaction.actions[0]?.FunctionCall?.args);
        return args;
    },
    getMethodName(data: TxData) {
        return data.transaction.actions[0]?.FunctionCall?.method_name;
    },
    getTxStatus(data: TxData) {
        return !data.status[FinalExecutionStatusBasic.Failure]
            ? ETransactionStatus.success
            : ETransactionStatus.fail;
    },
    getAmount(data: TxData, amount: string, defaultMetaData?: any) {
        const metaData =
            (Object.values(data.metaData || {}).length
                ? data.metaData
                : defaultMetaData) || {};
        if (amount) {
            return this.formatAmountFromMeta(amount, metaData);
        }
        return '';
    },
    formatAmountFromMeta(amount: string, metaData?: IMetaData): string {
        if (amount && metaData) {
            const num =
                removeTrailingZeros(formatTokenAmount(amount, metaData.decimals, 5)) ||
                '0';
            if (Number(num) > 0.01) {
                return (
                    removeTrailingZeros(formatTokenAmount(amount, metaData.decimals)) +
                    ' ' +
                    (metaData.symbol || '')
                );
            }
            return num + ' ' + (metaData.symbol || '');
        }
        return amount;
    },
    getTxDirection(data: TxData, accountId: string): ETxDirection {
        if (data.transaction.signer_id === data.transaction.receiver_id) {
            return ETxDirection.self;
        }
        const isReceivedFund = data.transaction.signer_id === accountId;
        if (isReceivedFund) {
            return ETxDirection.send;
        } else {
            return ETxDirection.receive;
        }
    },
    decodeArgs(args_base64) {
        const args_raw = args_base64 ? atob(args_base64) : '';
        try {
            const args = JSON.parse(args_raw || '{}') || {};
            return args;
        } catch (err) {
            return {};
        }
    },
    defaultDisplay(data: TxData) {
        return {
            id: data.transaction.hash,
            dateTime: data.block_timestamp,
            transactionHash: data.transaction.hash,
            hasError: !!data.status?.[FinalExecutionStatusBasic.Failure],
        };
    },
};

class TransferPattern implements TxPattern {
    match(data: TxData): boolean {
        const primaryReceipt = txUtils.getPrimaryReceipt(data);
        return !!primaryReceipt?.receipt.Action.actions[0]?.Transfer;
    }

    display(data: TxData, accountId: string): TransactionItemComponent {
        const dir = txUtils.getTxDirection(data, accountId);
        const isReceived = dir === ETxDirection.receive;
        return {
            image: data.metaData.icon || '',
            title: isReceived ? 'Received' : 'Sent',
            subtitle:
                dir === ETxDirection.receive
                    ? `from ${data.transaction.signer_id}`
                    : `to ${data.transaction.receiver_id}`,
            status: txUtils.getTxStatus(data),
            assetChangeText: txUtils.getAmount(
                data,
                data.transaction.actions[0].Transfer!.deposit
            ),
            dir,
            ...txUtils.defaultDisplay(data),
        };
    }
}

class TransferFtPattern implements TxPattern {
    match(data: TxData): boolean {
        const methodName = txUtils.getMethodName(data);
        return methodName === TxMethodName.ft_transfer;
    }

    display(data: TxData, accountId: string): TransactionItemComponent {
        const args = txUtils.decodeArgs(data.transaction.actions[0]?.FunctionCall.args);
        const dir = txUtils.getTxDirection(data, accountId);
        const isReceived = dir === ETxDirection.receive;
        return {
            image: data.metaData.icon || '',
            title: isReceived ? 'Received' : 'Sent',
            subtitle: isReceived
                ? `from ${data.transaction.signer_id}`
                : `to ${args.receiver_id || args.receiverId}`,
            status: txUtils.getTxStatus(data),
            assetChangeText: txUtils.getAmount(data, args.amount),
            dir,
            ...txUtils.defaultDisplay(data),
        };
    }
}

class DeployPattern implements TxPattern {
    match(data: TxData): boolean {
        const methodName = txUtils.getMethodName(data);
        return (
            !!data.transaction.actions[0]?.DeployContract ||
            methodName === TxMethodName.deploy
        );
    }

    display(data: TxData): TransactionItemComponent {
        return {
            image: imgDeploy,
            title: 'Deploy Contract',
            // subtitle: `Deploy Contract`,
            status: txUtils.getTxStatus(data),
            ...txUtils.defaultDisplay(data),
        };
    }
}

class CreateAccountPattern implements TxPattern {
    match(data: TxData): boolean {
        const methodName = txUtils.getMethodName(data);
        return (
            !!data.transaction.actions[0]?.CreateAccount ||
            methodName === TxMethodName.create_account
        );
    }

    display(data: TxData): TransactionItemComponent {
        const args = txUtils.getFcArgs(data);
        return {
            image: imgKey,
            title: 'Create Account',
            subtitle: args?.new_account_id,
            status: txUtils.getTxStatus(data),
            ...txUtils.defaultDisplay(data),
        };
    }
}

class SwapPattern implements TxPattern {
    private whitelistedReceivers = ['v2.ref-finance.near', 'v1.jumbo_exchange.near'];
    private hasError(data: TxData) {
        return data.receipts_outcome.some(
            (r) => r.outcome.status[FinalExecutionStatusBasic.Failure]
        );
    }

    match(data: TxData): boolean {
        const methodName = txUtils.getMethodName(data);
        if (methodName !== TxMethodName.ft_transfer_call) {
            return false;
        }
        const args = txUtils.getFcArgs(data);
        if (!args.msg) {
            return false;
        }
        return this.whitelistedReceivers.includes(args.receiver_id);
    }

    display(data: TxData): TransactionItemComponent {
        const args = txUtils.decodeArgs(data.transaction.actions[0]?.FunctionCall.args);

        let receivedAmount = '0';
        const hasError = this.hasError(data);
        let meta;
        let receiverId;
        data.receipts.forEach((r) => {
            const fc =
                r.receipt.Action.actions[0]?.FunctionCall || ({} as ITxFunctionCall);
            const args = txUtils.decodeArgs(fc.args);
            if (this.whitelistedReceivers.includes(r.receiver_id)) {
                receiverId = r.receiver_id;
            }
            if (
                fc.method_name === TxMethodName.ft_transfer ||
                fc.method_name === TxMethodName.near_withdraw ||
                (hasError && fc.method_name === TxMethodName.ft_resolve_transfer)
            ) {
                if (r.metaData) {
                    meta = r.metaData;
                }
                receivedAmount = args.amount;
            }
        });

        return {
            image: imgSwap,
            image2: meta?.icon,
            title: 'Swap',
            subtitle: `via ${receiverId || data.transaction.receiver_id}`,
            assetChangeText: txUtils.formatAmountFromMeta(receivedAmount, meta),
            assetChangeText2: txUtils.formatAmountFromMeta(args.amount, data.metaData),
            status: txUtils.getTxStatus(data),
            dir: ETxDirection.receive,
            ...txUtils.defaultDisplay(data),
            hasError,
        };
    }
}

class NftPattern implements TxPattern {
    match(data: TxData): boolean {
        const methodName = txUtils.getMethodName(data);
        return methodName === TxMethodName.nft_transfer;
    }

    display(
        data: TxData,
        accountId: string,
        network: ENearNetwork
    ): TransactionItemComponent {
        const args = txUtils.decodeArgs(data.transaction.actions[0]?.FunctionCall.args);
        const dir = txUtils.getTxDirection(data, accountId);
        const isReceivedNft = dir === ETxDirection.receive;

        return {
            isNft: true,
            image:
                IpfsCacheApi.getNftTokenImgUrl(
                    network,
                    data.transaction.receiver_id,
                    args.token_id
                ) || imgAppInteraction,
            title: isReceivedNft ? 'NFT' : 'Sent',
            subtitle: isReceivedNft
                ? `from ${data.transaction.signer_id}`
                : `to ${
                      args.receiver_id || args.receiverId || data.transaction.receiver_id
                  }`,
            status: txUtils.getTxStatus(data),
            assetChangeText: `1 ${data.metaData.symbol}`,
            dir,
            ...txUtils.defaultDisplay(data),
        };
    }
}

class FtMintPattern implements TxPattern {
    match(data: TxData): boolean {
        return txUtils.getMethodName(data) === TxMethodName.ft_mint;
    }

    display(data: TxData): TransactionItemComponent {
        const fc = txUtils.getFcArgs(data);
        const content = JSON.parse(fc?.content || '{}');
        return {
            image: data.metaData.icon || imgAppInteraction,
            title: 'Mint',
            subtitle: `from ${data.transaction.signer_id}`,
            status: txUtils.getTxStatus(data),
            assetChangeText: txUtils.formatAmountFromMeta(content?.amount, data.metaData),
            dir: ETxDirection.receive,
            ...txUtils.defaultDisplay(data),
        };
    }
}

class MintPattern implements TxPattern {
    match(data: TxData): boolean {
        const methodName = txUtils.getMethodName(data);
        return methodName === TxMethodName.mint;
    }

    display(data: TxData): TransactionItemComponent {
        return {
            image: data.metaData.icon || '',
            title: 'Mint',
            subtitle: `with ${data.transaction.receiver_id}`,
            status: txUtils.getTxStatus(data),
            dir: ETxDirection.receive,
            ...txUtils.defaultDisplay(data),
        };
    }
}

class NftMintPattern implements TxPattern {
    match(data: TxData): boolean {
        const methodName = txUtils.getMethodName(data);
        return methodName === TxMethodName.nft_mint;
    }

    display(
        data: TxData,
        accountId: string,
        network: ENearNetwork
    ): TransactionItemComponent {
        const args = txUtils.getFcArgs(data);
        let tokenId = args.id;
        try {
            for (const r of data.receipts_outcome) {
                if (r.outcome?.logs?.[0]) {
                    const log = JSON.parse(
                        r.outcome.logs[0].replace('EVENT_JSON:', '') || '{}'
                    );
                    if (log.standard === 'nep171') {
                        tokenId = log.data[0].token_ids[0];
                    }
                }
            }
        } catch (err) {
            console.error('parse nft mint log error');
        }
        return {
            isNft: true,
            image: tokenId
                ? IpfsCacheApi.getNftTokenImgUrl(
                      network,
                      data.transaction.receiver_id,
                      tokenId
                  )
                : imgAppInteraction,
            title: 'Mint',
            subtitle: `with ${data.transaction.receiver_id}`,
            status: txUtils.getTxStatus(data),
            dir: ETxDirection.receive,
            assetChangeText: `1 ${data.metaData.symbol || ''}`,
            ...txUtils.defaultDisplay(data),
        };
    }
}

class NftBuyPattern implements TxPattern {
    match(data: TxData): boolean {
        const methodName = txUtils.getMethodName(data);
        return methodName === TxMethodName.nft_buy || methodName === TxMethodName.buy;
    }

    display(
        data: TxData,
        accountId: string,
        network: ENearNetwork
    ): TransactionItemComponent {
        const args = txUtils.getFcArgs(data);
        let tokenId = args.id || args.token_id;
        try {
            const log = JSON.parse(
                data.receipts_outcome[0].outcome?.logs?.[0].replace('EVENT_JSON:', '') ||
                    '{}'
            );
            if (log.standard === 'nep171') {
                tokenId = log.data[0].token_ids[0];
            }
        } catch (err) {
            console.error('parse nft mint log error');
        }
        const contractId = args.nft_contract_id || data.transaction.receiver_id;
        return {
            isNft: true,
            image:
                IpfsCacheApi.getNftTokenImgUrl(network, contractId, tokenId) ||
                imgAppInteraction,
            title: 'Buy',
            subtitle: `from ${data.transaction.receiver_id}`,
            status: txUtils.getTxStatus(data),
            dir: ETxDirection.receive,
            assetChangeText: `1 ${data.metaData.symbol || ''}`,
            ...txUtils.defaultDisplay(data),
        };
    }
}

// 9QxrZZazXLTwMnwPKo4NN6juwLWnwG3dDfzcqNKVLDpG
class StakePattern implements TxPattern {
    match(data: TxData): boolean {
        const methodName = txUtils.getMethodName(data);
        return methodName === TxMethodName.deposit_and_stake;
    }

    display(data: TxData): TransactionItemComponent {
        const deposit = data.transaction.actions[0].FunctionCall.deposit;

        return {
            image: imgStaked,
            title: 'Staked',
            subtitle: `with ${data.transaction.receiver_id}`,
            assetChangeText: txUtils.getAmount(data, deposit, nearMetadata),
            status: txUtils.getTxStatus(data),
            dir: ETxDirection.send,
            ...txUtils.defaultDisplay(data),
        };
    }
}

class LiquidUnStakePattern implements TxPattern {
    match(data: TxData): boolean {
        const methodName = txUtils.getMethodName(data);
        return methodName === TxMethodName.liquid_unstake;
    }

    display(data: TxData): TransactionItemComponent {
        const args = txUtils.getFcArgs(data);
        return {
            image: imgUnStaked,
            title: 'Liquid Unstaked',
            subtitle: `with ${data.transaction.receiver_id}`,
            assetChangeText: txUtils.formatAmountFromMeta(
                args.st_near_to_burn,
                nearMetadata
            ),
            assetChangeText2: txUtils.formatAmountFromMeta(
                args.min_expected_near,
                data.metaData
            ),
            status: txUtils.getTxStatus(data),
            dir: ETxDirection.receive,
            ...txUtils.defaultDisplay(data),
        };
    }
}

// BMAPK8ENUHLsiCKCiz3DonowrEfsKxcuMZpqUxkYUGbu
class UnStakePattern implements TxPattern {
    match(data: TxData): boolean {
        const methodName = txUtils.getMethodName(data);
        return methodName === TxMethodName.unstake;
    }

    display(data: TxData): TransactionItemComponent {
        const args = txUtils.getFcArgs(data);
        return {
            image: imgUnStaked,
            title: 'Unstaked',
            subtitle: `with ${data.transaction.receiver_id}`,
            assetChangeText: txUtils.getAmount(data, args.amount, nearMetadata),
            status: txUtils.getTxStatus(data),
            dir: ETxDirection.receive,
            ...txUtils.defaultDisplay(data),
        };
    }
}

class ClaimPattern implements TxPattern {
    match(data: TxData): boolean {
        const methodName = txUtils.getMethodName(data);
        return methodName === TxMethodName.claim;
    }

    display(data: TxData, accountId: string): TransactionItemComponent {
        let amount = '0';
        let metaData = {};

        for (const r of data.receipts) {
            const rAction = r.receipt.Action?.actions?.[0];
            const fc = rAction?.FunctionCall;
            if (fc && fc?.method_name! === TxMethodName.ft_transfer) {
                const args = txUtils.decodeArgs(fc.args);
                amount = args.amount;
                if (r.metaData) {
                    metaData = r.metaData;
                }
                break;
            }
            if (rAction?.Transfer && r.receiver_id === accountId) {
                amount = rAction.Transfer?.deposit;
                if (r.metaData) {
                    metaData = r.metaData;
                }
            }
        }

        const txArgs = txUtils.getFcArgs(data);
        if (txArgs.amount) {
            amount = txArgs.amount;
        }
        return {
            image: imgClaim,
            title: 'Claim',
            subtitle: `from ${data.transaction.receiver_id}`,
            assetChangeText: txUtils.getAmount(data, amount, metaData),
            status: txUtils.getTxStatus(data),
            dir: ETxDirection.receive,
            ...txUtils.defaultDisplay(data),
        };
    }
}

class ClaimUnStakePattern implements TxPattern {
    match(data: TxData): boolean {
        const methodName = txUtils.getMethodName(data);
        return methodName === TxMethodName.withdraw_all;
    }

    display(data: TxData): TransactionItemComponent {
        let amount = '0';
        let metaData = {};

        for (const r of data.receipts) {
            const transfer = r.receipt.Action?.actions?.[0]?.Transfer;
            if (transfer?.deposit) {
                amount = transfer.deposit;
                if (r.metaData) {
                    metaData = r.metaData;
                }
                break;
            }
        }

        return {
            image: imgClaim,
            title: 'Claim Unstaked Near',
            subtitle: `from ${data.transaction.receiver_id}`,
            assetChangeText: txUtils.getAmount(data, amount, metaData),
            status: txUtils.getTxStatus(data),
            dir: ETxDirection.receive,
            ...txUtils.defaultDisplay(data),
        };
    }
}

class AddKeyPattern implements TxPattern {
    match(data: TxData): boolean {
        return !!data.transaction.actions[0].AddKey?.public_key;
    }

    display(data: TxData): TransactionItemComponent {
        const action = data.transaction.actions[0];
        return {
            image: imgKey,
            title: 'Add Key',
            subtitle: action.AddKey.public_key,
            ...txUtils.defaultDisplay(data),
        };
    }
}

class DeleteKeyPattern implements TxPattern {
    match(data: TxData): boolean {
        return !!data.transaction.actions[0].DeleteKey?.public_key;
    }

    display(data: TxData): TransactionItemComponent {
        const action = data.transaction.actions[0];
        return {
            image: imgKeyDelete,
            title: 'Delete Key',
            subtitle: action.DeleteKey.public_key,
            ...txUtils.defaultDisplay(data),
        };
    }
}

class DeployKeyPattern implements TxPattern {
    match(data: TxData): boolean {
        return txUtils.getMethodName(data) === TxMethodName.deploy;
    }

    display(data: TxData): TransactionItemComponent {
        return {
            image: imgDeploy,
            title: 'Deployed Contract',
            subtitle: data.transaction.receiver_id,
            ...txUtils.defaultDisplay(data),
        };
    }
}

class MeteorPointPattern implements TxPattern {
    match(data: TxData, network: ENearNetwork): boolean {
        return (
            txUtils.getMethodName(data) === TxMethodName.ft_mint &&
            data.transaction.receiver_id === getMeteorPointsContractId(network)
        );
    }

    display(data: TxData): TransactionItemComponent {
        const fc = txUtils.getFcArgs(data);
        const content = JSON.parse(fc.content);
        return {
            image: data.metaData.icon || '',
            title: 'Received',
            subtitle: `from ${data.transaction.receiver_id}`,
            assetChangeText: txUtils.formatAmountFromMeta(content?.amount, data.metaData),
            dir: ETxDirection.receive,
            ...txUtils.defaultDisplay(data),
        };
    }
}

class HarvestMoonRecruitTinker implements TxPattern {
    match(data: TxData): boolean {
        return txUtils.getMethodName(data) === TxMethodName.recruit_tinkers;
    }

    display(data: TxData): TransactionItemComponent {
        let amount;
        try {
            for (const r of data.receipts_outcome) {
                if (r.outcome?.logs?.length) {
                    for (const rawLog of r.outcome?.logs) {
                        const logs = rawLog.split(' ');
                        if (logs[0] === 'Added' && logs[2] === 'count') {
                            amount = logs[1];
                        }
                    }
                }
            }
        } catch (err) {
            console.error('parse harvestmoon recruit tinker error');
        }
        return {
            image: data.metaData.icon || '',
            title: 'Recruit tinker',
            subtitle: `from ${data.transaction.receiver_id}`,
            assetChangeText: amount ? `${amount} Tinker` : '',
            dir: ETxDirection.receive,
            ...txUtils.defaultDisplay(data),
        };
    }
}

class HarvestMoonHarvest implements TxPattern {
    match(data: TxData): boolean {
        return txUtils.getMethodName(data) === TxMethodName.harvest;
    }

    display(data: TxData, accountId: string): TransactionItemComponent {
        let amount = '0';
        let isReferral = false;
        try {
            for (const r of data.receipts_outcome) {
                if (r.outcome?.logs?.length) {
                    for (const rawLog of r.outcome?.logs) {
                        if (rawLog.includes('EVENT_JSON:')) {
                            const log = JSON.parse(
                                rawLog.replace('EVENT_JSON:', '') || '{}'
                            );
                            if (log.standard === 'nep141') {
                                if (
                                    log.data[0].owner_id === accountId &&
                                    log.data[0].memo === 'Referral'
                                ) {
                                    isReferral = true;
                                }
                                amount = log.data[0].amount;
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('parse harvestmoon harvest error');
        }

        return {
            image: data.metaData.icon || '',
            title: isReferral ? 'Referral Harvest' : 'Harvest',
            subtitle: `from ${data.transaction.receiver_id}`,
            assetChangeText: txUtils.formatAmountFromMeta(amount, data.metaData),
            dir: ETxDirection.receive,
            ...txUtils.defaultDisplay(data),
        };
    }
}

class DelegatePattern implements TxPattern {
    match(data: TxData): boolean {
        return !!data.transaction.actions?.[0]?.Delegate;
    }

    display(data: TxData, accountId, network): TransactionItemComponent {
        const actions = data.transaction.actions?.[0]?.Delegate?.delegate_action;

        const defaultPattern = new TxDefaultPattern();
        if (!actions) {
            return defaultPattern.display(data);
        }

        const newData = {
            ...data,
            transaction: {
                ...data.transaction,
                ...actions,
                signer_id: actions.receiver_id,
            },
        };
        const matchedPattern = txPatterns.find((t) => t.match(newData, network));
        if (matchedPattern) {
            return matchedPattern.display(newData, accountId, network);
        }

        return defaultPattern.display(data);
    }
}

function TxSubtitle({ texts }) {
    return `${!!texts[0] && texts[0]}
            ${texts[1]}
            ${texts[2]}
            ${texts[3]}`;
}

class MultiActionsPattern implements TxPattern {
    match(data: TxData): boolean {
        return data.transaction.actions.length > 1;
    }

    display(data: TxData, accountId: string): TransactionItemComponent {
        const fc = txUtils.getFcArgs(data);

        const subCard = data.receipts
            .map((r) => {
                const fc =
                    r.receipt.Action.actions?.[0]?.FunctionCall ||
                    ({} as ITxFunctionCall);
                const args = txUtils.decodeArgs(fc?.args);

                const dir = txUtils.getTxDirection(data, accountId);
                return {
                    id: r.receipt_id,
                    image: r.metaData?.icon || '',
                    title: dir === ETxDirection.receive ? 'Received' : 'Sent',
                    assetChangeText: methodNameShowlist.includes(fc.method_name)
                        ? txUtils.formatAmountFromMeta(args.amount, r.metaData)
                        : '',
                    dir,
                };
            })
            .filter((r) => r.assetChangeText);

        return {
            // image: data.metaData.icon || imgAppInteraction,
            image: imgBatch,
            title: 'Batch Transactions',
            subtitle: `Performed ${data.transaction.actions.length} actions`,
            status: txUtils.getTxStatus(data),
            assetChangeText: txUtils.formatAmountFromMeta(
                fc?.amount || fc?.total,
                data.metaData
            ),
            subCard: subCard.length > 1 ? subCard : undefined,
            ...txUtils.defaultDisplay(data),
        };
    }
}

class FunctionCallDefaultPattern implements TxPattern {
    match(data: TxData): boolean {
        const methodName = txUtils.getMethodName(data);
        return !!methodName;
    }

    display(data: TxData, accountId: string): TransactionItemComponent {
        const methodName = txUtils.getMethodName(data);
        const subCard = data.receipts
            .map((r) => {
                const fc =
                    r.receipt.Action.actions?.[0]?.FunctionCall ||
                    ({} as ITxFunctionCall);
                const args = txUtils.decodeArgs(fc?.args);
                const dir =
                    r.receipt.Action.signer_id === args.receiver_id
                        ? ETxDirection.receive
                        : ETxDirection.send;
                return {
                    id: r.receipt_id,
                    image: r.metaData?.icon || '',
                    title: dir === ETxDirection.receive ? 'Received' : 'Sent',
                    // assetChangeText: txUtils.formatAmountFromMeta(args.amount, r.metaData),
                    assetChangeText: methodNameShowlist.includes(fc.method_name)
                        ? txUtils.formatAmountFromMeta(args.amount, r.metaData)
                        : '',
                    dir,
                };
            })
            .filter((r) => r.assetChangeText);

        return {
            image: imgAppInteraction,
            title: 'App Interaction',
            subtitle: TxSubtitle({
                texts: ['Called', methodName, 'on', data.transaction.receiver_id],
            }),
            status: txUtils.getTxStatus(data),
            // assetChangeText:
            //   subCard.length === 1
            //     ? subCard[0].assetChangeText
            //     : txUtils.formatAmountFromMeta(
            //         fc?.amount || fc?.total,
            //         data.metaData,
            //       ),
            subCard: subCard.length > 1 ? subCard : undefined,
            dir: txUtils.getTxDirection(data, accountId),
            ...txUtils.defaultDisplay(data),
        };
    }
}

export class TxDefaultPattern {
    // display action type
    display(data: TxData): TransactionItemComponent {
        const action = data.transaction.actions[0];

        const key = Object.keys(action)?.[0];
        const isNearActionKind = Object.values(ETxActionKind).includes(
            key as ETxActionKind
        );

        return {
            image: data.metaData.icon || imgAppInteraction,
            title: isNearActionKind
                ? ETxActionKindTextMap[key] || key
                : 'App Interaction',
            subtitle: `with ${data.transaction.receiver_id}`,
            status: txUtils.getTxStatus(data),
            ...txUtils.defaultDisplay(data),
        };
    }
}

export const txPatterns: TxPattern[] = [
    new MultiActionsPattern(),
    new TransferPattern(),
    new TransferFtPattern(),
    new DeployPattern(),
    new CreateAccountPattern(),
    new SwapPattern(),
    new NftPattern(),
    new MintPattern(),
    new FtMintPattern(),
    new NftMintPattern(),
    new NftBuyPattern(),
    new StakePattern(),
    new UnStakePattern(),
    new ClaimPattern(),
    new ClaimUnStakePattern(),
    new LiquidUnStakePattern(),
    new AddKeyPattern(),
    new DeleteKeyPattern(),
    new DeployKeyPattern(),
    new MeteorPointPattern(),
    new HarvestMoonRecruitTinker(),
    new HarvestMoonHarvest(),
    new DelegatePattern(),
    new FunctionCallDefaultPattern(),
];
