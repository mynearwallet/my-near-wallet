import { useSelector } from 'react-redux';

import { selectTokensSlice } from '../../../../redux/slices/swap';

export default function useTokens() {
    const swapTokens = useSelector(selectTokensSlice);

    return Object.values(swapTokens);
}
