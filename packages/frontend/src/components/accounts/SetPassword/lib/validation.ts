const MIN_PASS_LEN = 8;
const MAX_PASS_LEN = 20;

export const inLength = (value: string): boolean =>
    value.length >= MIN_PASS_LEN && value.length <= MAX_PASS_LEN;

export const isEqual = (a: string, b: string): boolean => a === b;
