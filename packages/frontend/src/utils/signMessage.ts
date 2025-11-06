import * as borsh from 'borsh';

//
// https://github.com/near/NEPs/blob/master/neps/nep-0413.md
//

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

export const messageToSign = (
    data: {
        message: string;
        nonce: string;
        recipient: string;
        callbackUrl?: string;
    },
    isLedger: boolean
) => {
    const nonce = isBase64(data.nonce)
        ? Buffer.from(data.nonce, 'base64')
        : Buffer.from(data.nonce);
    if (isLedger) {
        const payload = {
            ...data,
            nonce,
        };

        return borsh.serialize(
            {
                struct: {
                    message: 'string',
                    nonce: { array: { type: 'u8', len: 32 } },
                    recipient: 'string',
                    callbackUrl: { option: 'string' },
                },
            },
            payload
        );
    } else {
        const payload = {
            tag: 2147484061,
            ...data,
            nonce,
        };

        return borsh.serialize(
            {
                struct: {
                    tag: 'u32',
                    message: 'string',
                    nonce: { array: { type: 'u8', len: 32 } },
                    recipient: 'string',
                    callbackUrl: { option: 'string' },
                },
            },
            payload
        );
    }
};
