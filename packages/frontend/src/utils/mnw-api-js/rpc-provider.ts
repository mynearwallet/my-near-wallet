import { JsonRpcProvider } from '@near-js/providers';
import { TypedError } from '@near-js/types';

import { RpcInfo, RpcRotator } from './rpc-list';

export class RpcProvider extends JsonRpcProvider {
    async sendJsonRpc<T>(method: string, params: object): Promise<T> {
        const rpcRotator: RpcRotator = new RpcRotator();
        const originalConnectionUrl: string = this.connection.url;

        let result: T = undefined;

        do {
            try {
                result = await super.sendJsonRpc<T>(method, params);
            } catch (err) {
                if (err instanceof TypedError && err.type === 'RetriesExceeded') {
                    const nextRpc: RpcInfo = rpcRotator.next(this.connection.url);
                    this.connection.url = nextRpc.url;
                } else {
                    this.connection.url = originalConnectionUrl;
                    throw err;
                }
            }
        } while (result === 'undefined');

        return result;
    }
}
