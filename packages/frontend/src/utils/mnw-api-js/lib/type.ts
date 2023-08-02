export interface ConnectionInfo {
    url: string;
    user?: string;
    password?: string;
    allowInsecure?: boolean;
    timeout?: number;
    headers?: { [key: string]: string | number };
}

export type RpcOptionKeyType = 'url' | 'apiKey' | 'headers';

export interface RpcOptionValue {
    url?: string;
    apiKey?: string;
    headers?: Record<string, string>;
}

export interface RpcOption {
    id: string;
    defaultParams?: RpcOptionValue;
    userParams?: RpcOptionKeyType[];
    generator?: (params: RpcOptionValue) => ConnectionInfo;
}

export interface RpcProviderDetail {
    id: string;
    label: string;
    data: RpcOptionValue;
    priority: number;
}
