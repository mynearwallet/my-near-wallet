import { useQuery } from 'react-query';

import { ConnectionsStorage } from '../../storage';

const rpcProvider = ConnectionsStorage.from(localStorage).createProvider();

function _viewFunction(
    contractName: string,
    methodName: string,
    args: any,
    finality: string = 'final'
): Promise<any> {
    return rpcProvider.query({
        request_type: 'call_function',
        account_id: contractName,
        method_name: methodName,
        args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
        finality,
    });
}

interface SBTToken {
    account: string;
    contract: string;
    tokenName: string;
    tokenId: number;
    tokenMetadata: string;
}

const soulboundContracts: string[] = ['registry.i-am-human.near'];

async function getSoulBoundTokens(
    account: string,
    contract: string
): Promise<SBTToken[] | undefined> {
    try {
        const viewFunctionResult = (
            await _viewFunction(contract, 'sbt_tokens_by_owner', { account })
        ).result;
        const arr: any[] = JSON.parse(Buffer.from(viewFunctionResult).toString());
        return arr.map(
            (item): SBTToken => ({
                account,
                contract,
                tokenName: item[0],
                tokenId: item[1][0].token,
                tokenMetadata: item[1][0].metadata,
            })
        );
    } catch (err) {
        console.log(err);
        return undefined;
    }
}

export const useSoulboundTokens = (availableAccounts: string[]) => {
    return useQuery({
        queryKey: ['soulboundTokens', availableAccounts],
        queryFn: async () => {
            const promises: Promise<any>[] = [];
            const tokens: SBTToken[] = [];

            availableAccounts.map((account) => {
                soulboundContracts.map((contract) => {
                    promises.push(
                        getSoulBoundTokens(account, contract).then((arr) =>
                            arr?.forEach((token) => tokens.push(token))
                        )
                    );
                });
            });

            await Promise.all(promises);

            return tokens;
        },
    });
};
