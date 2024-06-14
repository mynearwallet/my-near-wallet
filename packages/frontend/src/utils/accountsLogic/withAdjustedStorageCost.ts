import * as nearApiJs from 'near-api-js';
import BN from 'bn.js';

type NearApiJsAccountConstructor = new (...args: any[]) => nearApiJs.Account;

export function withAdjustedStorageCost<
    AccountConstructor extends NearApiJsAccountConstructor
>(Account: AccountConstructor) {
    return class AccountWithAdjustedStorageCost extends Account {
        async getAccountBalance(
            ...args: Parameters<nearApiJs.Account['getAccountBalance']>
        ): ReturnType<nearApiJs.Account['getAccountBalance']> {
            const originalBalance = await super.getAccountBalance(...args);

            const totalBalance = new BN(originalBalance.total);
            const stateStaked = new BN(originalBalance.stateStaked)
                .mul(new BN(1024))
                .div(new BN(1000));
            const staked = new BN(originalBalance.staked);
            const availableBalance = totalBalance.sub(BN.max(staked, stateStaked));

            return {
                total: totalBalance.toString(),
                stateStaked: stateStaked.toString(),
                staked: staked.toString(),
                available: availableBalance.toString(),
            };
        }
    };
}
