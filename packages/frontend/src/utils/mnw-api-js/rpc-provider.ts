import { JsonRpcProvider, TypedError } from 'near-api-js/lib/providers';

import { RpcInfo, RpcRotator } from './rpc-list';

export class RpcProvider extends JsonRpcProvider {
    async sendJsonRpc<T>(method: string, params: object): Promise<T> {
        const rpcRotator: RpcRotator = new RpcRotator();
        const originalConnectionUrl: string = this.connection.url;

        let result: T = undefined;

        try {
            do {
                try {
                    result = await super.sendJsonRpc<T>(method, params);
                } catch (err) {
                    if (err instanceof TypedError && err.type === 'RetriesExceeded') {
                        const nextRpc: RpcInfo = rpcRotator.next(this.connection.url);
                        this.connection.url = nextRpc.url;
                    } else {
                        throw err;
                    }
                }
            } while (result === 'undefined');
        } catch (err) {
            this.connection.url = originalConnectionUrl;
            throw err;
        }

        this.connection.url = originalConnectionUrl;
        return result;
    }
}
