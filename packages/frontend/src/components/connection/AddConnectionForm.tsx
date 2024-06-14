import React from 'react';
import { useTranslation } from 'react-i18next';

import HeaderEditor from './HeaderEditor';
import CONFIG from '../../config';
import {
    RpcOption,
    RpcProvider,
    RpcProviderDetail,
    RpcRotator,
} from '../../utils/mnw-api-js';

const rpcOptionList = RpcRotator.getRpcOptionList(
    CONFIG.NEAR_WALLET_ENV.startsWith('mainnet') ? 'mainnet' : 'testnet'
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function AddConnectionForm({ connection, saveConnection }) {
    const { t } = useTranslation();

    const [currentRpcOption, setCurrentRpcOption] = React.useState<RpcOption>(() => {
        let currentRpcOption: RpcOption;

        rpcOptionList.forEach((rpcOption) => {
            if (rpcOption.id === connection.id) {
                currentRpcOption = rpcOption;
            }
        });

        return currentRpcOption;
    });
    const [url, setUrl] = React.useState<string>(connection.data?.url ?? '');
    const [apiKey, setApiKey] = React.useState<string>(connection.data?.apiKey ?? '');
    const [headers, setHeaders] = React.useState<Record<string, string>>(
        connection.data?.headers ?? {}
    );
    const [label, setLabel] = React.useState<string>(connection.label ?? '');
    const [priority, setPriority] = React.useState<number>(connection.priority ?? 10);
    const [testing, setTesting] = React.useState<boolean>(false);
    const [connectionError, setConnectionError] = React.useState<string>('');

    const rpcOptionPillList = React.useMemo(() => {
        return rpcOptionList.map((rpcOption) => (
            <div
                key={rpcOption.id}
                className={`text-md px-4 py-3 mt-3 mr-3 rounded-full ${
                    currentRpcOption === rpcOption
                        ? 'bg-sky-800 text-sky-100'
                        : 'bg-gray-200 text-gray-800 cursor-pointer hover:bg-sky-600 hover:text-sky-100'
                }`}
                onClick={() => {
                    if (currentRpcOption === rpcOption) {
                        return;
                    }

                    setCurrentRpcOption(rpcOption);
                    setUrl('');
                }}
            >
                {t(`connection.rpcOption.${rpcOption.id}`)}
            </div>
        ));
    }, [currentRpcOption, setCurrentRpcOption]);

    const testAndSaveConnection = React.useCallback(() => {
        setConnectionError('');
        setTesting(true);

        const rpcProviderDetail: RpcProviderDetail = {
            id: currentRpcOption.id,
            label: label || currentRpcOption.id,
            data: {},
            priority,
        };

        if (currentRpcOption.userParams !== undefined) {
            if (currentRpcOption.userParams.includes('url')) {
                rpcProviderDetail.data.url = url;
            }
            if (currentRpcOption.userParams.includes('apiKey')) {
                rpcProviderDetail.data.apiKey = apiKey;
            }
            if (currentRpcOption.userParams.includes('headers')) {
                rpcProviderDetail.data.headers = headers;
            }
        }

        const rpcProvider = new RpcProvider(new RpcRotator([rpcProviderDetail]));

        rpcProvider
            .sendJsonRpc('gas_price', [null])
            .then(() => {
                saveConnection(rpcProviderDetail);
            })
            .catch((err) => setConnectionError(err.toString()))
            .finally(() => {
                setTesting(false);
            });
    }, [currentRpcOption, url, apiKey, headers, label, priority]);

    return (
        <>
            <div className='mt-4 text-lg text-sky-700 font-bold'>
                {t('connection.addRpcProviderModal.step1')}
            </div>
            <div className='flex flex-row flex-wrap'>{rpcOptionPillList}</div>
            <div className='mt-4 text-lg text-sky-700 font-bold'>
                {t('connection.addRpcProviderModal.step2')}
            </div>
            {currentRpcOption.userParams === undefined && (
                <div className='text-lg text-gray-600 mt-3'>
                    {t('connection.addRpcProviderModal.noConfig')}
                </div>
            )}
            {currentRpcOption.userParams &&
                currentRpcOption.userParams.includes('url') && (
                    <>
                        <h4 className='text-lg text-bold text-sky-950 mt-2'>
                            {t('connection.url')}
                        </h4>
                        <input
                            type='text'
                            className='w-full text-md border-gray-400 bg-gray-100 text-gray-800 rounded-md px-2'
                            placeholder='https://example.com'
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                    </>
                )}
            {currentRpcOption.userParams &&
                currentRpcOption.userParams.includes('apiKey') && (
                    <>
                        <h4 className='text-lg text-bold text-sky-950 mt-2'>
                            {t('connection.apiKey')}
                        </h4>
                        <input
                            type='text'
                            className='w-full text-md border-gray-400 bg-gray-100 text-gray-800 rounded-md px-2'
                            placeholder="Get the API Key from the RPC provider's website"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                    </>
                )}
            {currentRpcOption.userParams &&
                currentRpcOption.userParams.includes('headers') && (
                    <HeaderEditor headers={headers} setHeaders={setHeaders} />
                )}
            <div className='mt-4 text-lg text-sky-700 font-bold'>
                {t('connection.addRpcProviderModal.step3')}
            </div>
            <div className='grid grid-cols-2 gap-3 mt-2'>
                <div>
                    <h4 className='text-lg text-bold text-sky-950 mt-2'>
                        {t('connection.addRpcProviderModal.connectionName')}
                    </h4>
                    <input
                        type='text'
                        className='w-full text-md border-gray-400 bg-gray-100 text-gray-800 rounded-md px-2'
                        placeholder='Any name that you want to name this connection as'
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                    />
                </div>
                <div>
                    <h4 className='text-lg text-bold text-sky-950 mt-2'>
                        {t('connection.addRpcProviderModal.priority')}
                    </h4>
                    <input
                        type='number'
                        className='w-full text-md border-gray-400 bg-gray-100 text-gray-800 rounded-md px-2'
                        placeholder=''
                        value={priority}
                        onChange={(e) => setPriority(parseInt(e.target.value))}
                    />
                </div>
            </div>
            <div className='mt-4 text-lg text-sky-700 font-bold'>
                {t('connection.addRpcProviderModal.step4')}
            </div>
            <button
                type='button'
                disabled={testing}
                className='mt-4 text-lg rounded-lg px-5 py-4 text-center text-sky-100 bg-sky-800 
                    disabled:text-gray-800 disabled:bg-gray-200 disabled:cursor-wait'
                onClick={testAndSaveConnection}
            >
                {t('connection.addRpcProviderModal.testSave')}
            </button>
            {connectionError && (
                <div className='text-red-600 text-sm mt-1'>{connectionError}</div>
            )}
        </>
    );
}
