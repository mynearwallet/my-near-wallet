const MNW_GLOBAL_PASSWORD_PADDING_HASH_STA = '046a3cb39e12f55bec647d177cca8601';
const MNW_GLOBAL_PASSWORD_PADDING_HASH_END = '5fcf063200fac1d05790bfcbc42199dd';

function arrayBufferToHex(buffer: ArrayBuffer): string {
    const hashArray = Array.from(new Uint8Array(buffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function getPasswordHash(password: string): Promise<string> {
    const data = new TextEncoder().encode(
        `${MNW_GLOBAL_PASSWORD_PADDING_HASH_STA}${password}${MNW_GLOBAL_PASSWORD_PADDING_HASH_END}`
    );
    return arrayBufferToHex(await crypto.subtle.digest('SHA-256', data));
}
