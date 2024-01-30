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

export const validateNonce = (nonce?: string) => nonce && nonce.length === 32;

export const serialize = (value) => borsh.serialize(schema, value);
export const deserialize = (value) => borsh.deserialize(schema, value);

export const messageToSign = (data: {
    message: string;
    nonce: string;
    recipient: string;
    callbackUrl?: string;
}) => {
    const payload = {
        tag: 2147484061,
        ...data,
        nonce: Buffer.from(data.nonce),
    };

    return serialize(payload);
};
