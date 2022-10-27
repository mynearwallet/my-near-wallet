import { useSelector } from 'react-redux';

import CONFIG from '../config';
import selectNEARAsTokenWithMetadata from '../redux/selectors/crossStateSelectors/selectNEARAsTokenWithMetadata';
import { selectActiveAccountId } from '../redux/slices/activeAccount';
import { selectTokensFiatValueUSD } from '../redux/slices/tokenFiatValues';
import { selectTokensWithMetadataForAccountId } from '../redux/slices/tokens';
import compare from '../utils/compare';

export const useFungibleTokensIncludingNEAR = function ({ showTokensWithZeroBalance = false, includeNearContractName = false } = {}) {
    const NEARAsTokenWithMetadata = useSelector((state) => selectNEARAsTokenWithMetadata(state, {includeNearContractName}));
    const accountId = useSelector(selectActiveAccountId);
    const fungibleTokens = useSelector((state) =>
        selectTokensWithMetadataForAccountId(state, { accountId, showTokensWithZeroBalance })
    );

    const fungibleTokenPrices = useSelector(selectTokensFiatValueUSD);
    const fungibleTokensWithPrices = fungibleTokens.map((ft) => {
        let fiatValueMetadata;
        if (ft.fiatValueMetadata?.usd) {
            fiatValueMetadata = ft.fiatValueMetadata;
        } else {
            fiatValueMetadata = fungibleTokenPrices[ft.onChainFTMetadata.symbol] ?
                {...fungibleTokenPrices[ft.onChainFTMetadata.symbol]} :
                {...fungibleTokenPrices[ft.contractName]};
        }
        return { ...ft, fiatValueMetadata };
    });
    const sortingOrder = {
        [CONFIG.USN_CONTRACT]: 1,
        [CONFIG.NEAR_TOKEN_ID]: 2
    };
    fungibleTokensWithPrices.sort(compare({key: 'contractName', sortingOrder}));

    return [NEARAsTokenWithMetadata, ...fungibleTokensWithPrices];
};
