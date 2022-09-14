import { useSelector } from 'react-redux';

import { selectTokens } from '../../../../redux/slices/swap';

export default function useTokens() {
    const swapTokens = useSelector(selectTokens);

    return swapTokens;
}
