import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface IHeaderEditorParams {
    headers: Record<string, string>;
    setHeaders: (
        action:
            | Record<string, string>
            | ((headerObjectsState: Record<string, string>) => Record<string, string>)
    ) => void;
}

interface IHeaderObject {
    key: string;
    value: string;
    duplicateKey?: boolean;
}

export default function HeaderEditor({ headers = {}, setHeaders }: IHeaderEditorParams) {
    const { t } = useTranslation();

    const [headerObjects, _setHeaderObjects] = React.useState<IHeaderObject[]>(
        Object.keys(headers).map((headerKey) => ({
            key: headerKey,
            value: headers[headerKey],
        }))
    );

    const setHeaderObjectKey = React.useCallback((index, newKey) => {
        _setHeaderObjects((headerObjects) => {
            headerObjects[index] = {
                key: newKey,
                value: headerObjects[index].value,
            };

            const keysCount: Record<string, number> = {};

            headerObjects.forEach((headerObject) => {
                keysCount[headerObject.key] = keysCount[headerObject.key]
                    ? keysCount[headerObject.key] + 1
                    : 1;
            });

            headerObjects.forEach((headerObject) => {
                headerObject.duplicateKey = keysCount[headerObject.key] > 1;
            });

            return [...headerObjects];
        });
    }, []);

    const setHeaderObjectValue = React.useCallback((index, newValue) => {
        _setHeaderObjects((headerObjects) => {
            headerObjects[index].value = newValue;

            return [...headerObjects];
        });
    }, []);

    const deleteHeaderObject = React.useCallback((index) => {
        headerObjects.splice(index, 1);

        _setHeaderObjects((headerObjects) => {
            headerObjects.splice(index, 1);

            return [...headerObjects];
        });
    }, []);

    const addHeaderObject = React.useCallback(() => {
        _setHeaderObjects((headerObjects) => [
            ...headerObjects,
            {
                key: '',
                value: '',
            },
        ]);
    }, []);

    React.useEffect(() => {
        const newHeaders: Record<string, string> = headerObjects.reduce(
            (headers: Record<string, string>, { key, value }: IHeaderObject) => {
                headers[key] = value;

                return headers;
            },
            {} as Record<string, string>
        );

        setHeaders(newHeaders);
    }, [headerObjects]);

    return (
        <>
            <h4 className='text-lg text-bold text-sky-950 mt-2'>
                {t('connection.headers')}
            </h4>
            {headerObjects.map(
                ({ key, value, duplicateKey }: IHeaderObject, index: number) => (
                    <div key={index.toString()}>
                        <div className='flex flex-row items-center'>
                            <input
                                type='text'
                                className='flex-1 text-md border-gray-400 bg-gray-100 text-gray-800 rounded-md mr-2 px-2'
                                placeholder='x-api-key'
                                value={key}
                                onChange={(e) =>
                                    setHeaderObjectKey(index, e.target.value)
                                }
                            />
                            <input
                                type='text'
                                className='flex-1 text-md border-gray-400 bg-gray-100 text-gray-800 rounded-md mr-2 px-2'
                                placeholder='xxxxxxx-xxxxxxx-xxxxxxx'
                                value={value}
                                onChange={(e) =>
                                    setHeaderObjectValue(index, e.target.value)
                                }
                            />
                            <FontAwesomeIcon
                                className='flex-initial text-gray-600 text-lg hover:text-gray-900 cursor-pointer'
                                onClick={() => deleteHeaderObject(index)}
                                icon={faTrashCan}
                            />
                        </div>
                        {duplicateKey && (
                            <div className='text-red-600 text-sm mt-1'>
                                {t('connection.headerDuplicateKey')}
                            </div>
                        )}
                    </div>
                )
            )}
            <button
                type='button'
                disabled={headers[''] !== undefined}
                className='underline text-sky-600 hover:text-sky-700 text-md cursor-pointer disabled:text-gray-600 mt-1 disabled:cursor-not-allowed'
                onClick={addHeaderObject}
            >
                {t('connection.addNewHeader')}
            </button>
        </>
    );
}
