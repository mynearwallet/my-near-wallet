import React from 'react';

interface IHeaderEditorParams {
    headers: Record<string, string>;
    setHeaders: (
        action:
            | Record<string, string>
            | ((prevState: Record<string, string>) => Record<string, string>)
    ) => void;
}

export default function HeaderEditor({ headers = {}, setHeaders }: IHeaderEditorParams) {
    return (
        <>
            <h4 className='text-md text-bold text-sky-950'>Headers</h4>
            {Object.keys(headers).map((headerKey, index) => (
                <div className='flex flex-row items-center' key={index.toString()}>
                    <input
                        type='text'
                        className='flex-1'
                        placeholder='x-api-key'
                        value={headerKey}
                        onChange={(e) => {
                            const oldKey = headerKey;
                            const newKey = e.target.value;

                            const newHeaders = { ...headers };
                            newHeaders[newKey] = newHeaders[oldKey];
                            delete newHeaders[oldKey];

                            setHeaders(newHeaders);
                        }}
                    />
                    <input
                        type='text'
                        className='flex-1'
                        placeholder='xxxxxxx-xxxxxxx-xxxxxxx'
                        value={headers[headerKey]}
                        onChange={(e) => {
                            const newHeaders = { ...headers };
                            newHeaders[headerKey] = e.target.value;

                            setHeaders(newHeaders);
                        }}
                    />
                    <button
                        type='button'
                        className='flex-initial rounded-full w-6 h-6 bg-red-500 text-white font-bold ml-6'
                        onClick={() => {
                            const newHeaders = { ...headers };
                            delete newHeaders[headerKey];

                            setHeaders(newHeaders);
                        }}
                    >
                        &times;
                    </button>
                </div>
            ))}
            <button
                type='button'
                disabled={headers[''] !== undefined}
                className='underline text-sky-600 hover:text-sky-700 text-md cursor-pointer disabled:text-gray-600 mt-2 disabled:cursor-not-allowed'
                onClick={() =>
                    setHeaders({
                        ...headers,
                        '': '',
                    })
                }
            >
                Add new header
            </button>
        </>
    );
}
