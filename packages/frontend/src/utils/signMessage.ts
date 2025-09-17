import { BorshSchema, borshSerialize } from 'borsher';

//
// https://github.com/near/NEPs/blob/master/neps/nep-0413.md
//

export const messageNep413BorshSchema = BorshSchema.Struct({
    message: BorshSchema.String,
    nonce: BorshSchema.Array(BorshSchema.u8, 32),
    recipient: BorshSchema.String,
    callbackUrl: BorshSchema.Option(BorshSchema.String),
});

const isBase64 = (value: string) =>
    /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/.test(
        value
    );

export const validateNonce = (nonce?: string) => {
    if (nonce && isBase64(nonce)) {
        return Buffer.from(nonce, 'base64').length === 32;
    }
    return nonce && nonce.length === 32;
};

export const messageToSign = (data: {
    message: string;
    nonce: string;
    recipient: string;
    callbackUrl?: string;
}) => {
    const nonce = isBase64(data.nonce)
        ? Buffer.from(data.nonce, 'base64')
        : Buffer.from(data.nonce);
    const payload = {
        tag: 2147484061,
        ...data,
        nonce,
    };

    return borshSerialize(messageNep413BorshSchema, payload);
};
