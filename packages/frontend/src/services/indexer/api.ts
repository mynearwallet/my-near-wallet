import { stringifyUrl } from 'query-string';

import { NearBlocksTxnsResponse } from './type';
import CONFIG from '../../config';
import sendJson from '../../tmp_fetch_send_json';

export default {
    listTransactions: (
        accountId: string,
        page: number,
        perPage: number
    ): Promise<NearBlocksTxnsResponse> => {
        const url = `${CONFIG.INDEXER_NEARBLOCK_SERVICE_URL}/v1/account/${accountId}/txns`;
        return sendJson(
            'GET',
            stringifyUrl({
                url,
                query: {
                    order: 'desc',
                    page,
                    per_page: perPage,
                },
            })
        );
    },
};
