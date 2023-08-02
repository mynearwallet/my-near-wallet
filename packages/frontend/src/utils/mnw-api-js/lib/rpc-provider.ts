import { JsonRpcProvider, TypedError } from 'near-api-js/lib/providers';
import {
    parseRpcError,
    getErrorTypeFromErrorMessage,
} from 'near-api-js/lib/utils/rpc_errors';

import { RpcRotator } from './rpc-list';
import { ConnectionInfo, RpcRetryConfig } from './type';

let nextId: number = 1234;

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

export class RpcProvider extends JsonRpcProvider {
    readonly rotator: RpcRotator;
    readonly retryConfig: RpcRetryConfig;

    constructor(
        connectionInfoOrUrl?: string | ConnectionInfo,
        rpcRotator?: RpcRotator,
        retryConfig?: RpcRetryConfig
    ) {
        super(connectionInfoOrUrl);

        this.rotator =
            rpcRotator ??
            new RpcRotator([
                {
                    id: 'custom',
                    data: {
                        url:
                            (connectionInfoOrUrl as ConnectionInfo).url ??
                            (connectionInfoOrUrl as string),
                    },
                },
            ]);

        this.retryConfig = retryConfig ?? {
            attempt: 12,
            wait: 500,
            waitBackoff: 1.5,
        };
    }

    async sendJsonRpc<T>(method: string, params: object): Promise<T> {
        const requestBody = {
            method,
            params,
            id: nextId++,
            jsonrpc: '2.0',
        };

        for (
            let currentAttempt = 0;
            currentAttempt < this.retryConfig.attempt;
            currentAttempt++
        ) {
            try {
                if (currentAttempt > 0) {
                    await sleep(
                        Math.floor(
                            this.retryConfig.wait *
                                Math.pow(this.retryConfig.waitBackoff, currentAttempt - 1)
                        )
                    );
                }

                const connection = this.rotator.getConnection(currentAttempt);

                const httpResponse = await fetch(connection.url, {
                    method: 'POST',
                    body: JSON.stringify(requestBody),
                    headers: connection.headers,
                });

                if (!httpResponse.ok) {
                    continue;
                }

                const jsonResponse = await httpResponse.json();

                if (jsonResponse.error) {
                    if (typeof jsonResponse.error.data === 'object') {
                        if (
                            typeof jsonResponse.error.data.error_message === 'string' &&
                            typeof jsonResponse.error.data.error_type === 'string'
                        ) {
                            // if error data has error_message and error_type properties, we consider that node returned an error in the old format
                            throw new TypedError(
                                jsonResponse.error.data.error_message,
                                jsonResponse.error.data.error_type
                            );
                        }

                        throw parseRpcError(jsonResponse.error.data);
                    } else {
                        const errorMessage = `[${jsonResponse.error.code}] ${jsonResponse.error.message}: ${jsonResponse.error.data}`;
                        // NOTE: All this hackery is happening because structured errors not implemented
                        // TODO: Fix when https://github.com/nearprotocol/nearcore/issues/1839 gets resolved
                        if (
                            jsonResponse.error.data === 'Timeout' ||
                            errorMessage.includes('Timeout error') ||
                            errorMessage.includes('query has timed out')
                        ) {
                            throw new TypedError(errorMessage, 'TimeoutError');
                        }

                        throw new TypedError(
                            errorMessage,
                            getErrorTypeFromErrorMessage(jsonResponse.error.data)
                        );
                    }
                }

                const { result } = jsonResponse;

                return result;
            } catch (err) {
                console.log(err);
                continue;
            }
        }

        throw new TypedError(
            `Exceeded ${this.retryConfig.attempt} attempts for request to ${method}.`,
            'RetriesExceeded'
        );
    }
}
