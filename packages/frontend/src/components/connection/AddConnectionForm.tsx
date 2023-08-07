import React from 'react';

import HeaderEditor from './HeaderEditor';
import CONFIG from '../../config';
import { RpcOption, RpcRotator } from '../../utils/mnw-api-js';

const rpcOptionList = RpcRotator.getRpcOptionList(
    CONFIG.NETWORK_ID as 'mainnet' | 'testnet'
);

export default function AddConnectionForm() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [url, setUrl] = React.useState<string>('');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [apiKey, setApiKey] = React.useState<string>('');
    const [headers, setHeaders] = React.useState<Record<string, string>>({ '': '' });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [rpcOption, setRpcOption] = React.useState<RpcOption>();

    console.log(rpcOptionList);

    return (
        <>
            <HeaderEditor headers={headers} setHeaders={setHeaders} />
            <div>{JSON.stringify(rpcOptionList)}</div>
        </>
    );
}
