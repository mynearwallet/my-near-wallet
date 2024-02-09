import * as borsh from 'borsh';

//
// https://github.com/near/NEPs/blob/master/neps/nep-0413.md
//
const schema = {
    struct: {
        tag: 'u32',
        message: 'string',
        nonce: { array: { type: 'u8', len: 32 } },
        recipient: 'string',
        callbackUrl: { option: 'string' },
    },
};

const isBase64 = (value: string) => /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/.test(value);

export const validateNonce = (nonce?: string) => {
    if (nonce && isBase64(nonce)) {
        return Buffer.from(nonce, 'base64').length === 32;
    }
    return nonce && nonce.length === 32;
};

export const serialize = (value) => borsh.serialize(schema, value);
export const deserialize = (value) => borsh.deserialize(schema, value);

export const messageToSign = (data: {
    message: string;
    nonce: string;
    recipient: string;
    callbackUrl?: string;
}) => {
    const nonce = isBase64(data.nonce) ? Buffer.from(data.nonce, 'base64') : Buffer.from(data.nonce);
    const payload = {
        tag: 2147484061,
        ...data,
        nonce,
    };

    return serialize(payload);
};
