import BN from 'bn.js';
import { dispatchTransactionExecutor } from '../slices/sign/transactionExecutor';
import {
    METAPOOL_CONTRACT_ID,
    METAPOOL_STAKING_GAS,
} from '../../services/metapool/constant';
import { fungibleTokensService } from '../../services/FungibleTokens';
import { wallet } from '../../utils/wallet';
import CONFIG from '../../config';
import { functionCall } from 'near-api-js/lib/transaction';

export const liquidStaking = async ({ contractId, amountInYocto, accountId }) => {
    const isStorageDepositRequired = await fungibleTokensService.isStorageDepositRequired(
        {
            contractName: contractId,
            accountId: accountId,
        }
    );

    if (isStorageDepositRequired) {
        const account = await wallet.getAccount(accountId);
        console.log('no deposit, transfer storage deposit');
        await fungibleTokensService.transferStorageDeposit({
            account,
            contractName: contractId,
            receiverId: accountId,
            storageDepositAmount: CONFIG.FT_MINIMUM_STORAGE_BALANCE_LARGE,
        });
    }

    const result = await dispatchTransactionExecutor({
        receiverId: METAPOOL_CONTRACT_ID,
        actions: [
            functionCall(
                'deposit_and_stake',
                {},
                new BN(METAPOOL_STAKING_GAS),
                new BN(amountInYocto.toString())
            ),
        ],
    });
    return result;
};

export const liquidUnStake = async ({ contractId, amountInYocto, minExpectInYocto }) => {
    const result = await dispatchTransactionExecutor({
        receiverId: contractId,
        actions: [
            functionCall(
                'liquid_unstake',
                {
                    st_near_to_burn: amountInYocto,
                    min_expected_near: minExpectInYocto,
                },
                new BN(METAPOOL_STAKING_GAS),
                '0'
            ),
        ],
    });
    return result;
};

export const delayedUnstake = async ({ contractId, amountInYocto }) => {
    const result = await dispatchTransactionExecutor({
        receiverId: contractId,
        actions: [
            functionCall(
                'unstake',
                {
                    amount: amountInYocto,
                },
                new BN(+CONFIG.STAKING_GAS_BASE * 5),
                '0'
            ),
        ],
    });
    return result;
};

export const liquidWithdrawAll = async ({ contractId }) => {
    const result = await dispatchTransactionExecutor({
        receiverId: contractId,
        actions: [functionCall('withdraw_all', {}, new BN(METAPOOL_STAKING_GAS), '0')],
    });
    return result;
};
