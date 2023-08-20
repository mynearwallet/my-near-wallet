import { expect, test } from '@jest/globals';
import BN from 'bn.js';
import { NEAR_NOMINATION_EXP } from 'near-api-js/lib/utils/format';

import { NEAR_FRACTIONAL_DIGITS } from './config';
import { formatNearAmount, showInYocto, formatWithCommas } from './helpers';

const contextZeroAsNumber = 0;
const contextZeroAsProperString = '0';
const contextZeroAsMeaningfulString = '000';
const contextZeroAsBN = new BN(0);
const contextTiny = '123456';
const contextSmall = '1' + '0'.repeat(19);
const contextBig = '1234567' + '0'.repeat(21);

/* formatNearAmount */
test('formatNearAmount when given number 0', () => {
    expect(formatNearAmount(contextZeroAsNumber)).toBe('0');
});

test('formatNearAmount when given 0', () => {
    expect(formatNearAmount(contextZeroAsProperString)).toBe('0');
});

test('formatNearAmount when given 000', () => {
    expect(formatNearAmount(contextZeroAsMeaningfulString)).toBe('0');
});

test('formatNearAmount when given new BN(0)', () => {
    expect(formatNearAmount(contextZeroAsBN)).toBe('0');
});

test('formatNearAmount when given tiny raw amount', () => {
    const contextBoundaryTiny =
        '4' + '9'.repeat(NEAR_NOMINATION_EXP - NEAR_FRACTIONAL_DIGITS - 1);
    const expectedValueTiny = '< 0.' + '0'.repeat(NEAR_FRACTIONAL_DIGITS - 1) + '1';

    expect(formatNearAmount(contextBoundaryTiny)).toBe(expectedValueTiny);
});

test('formatNearAmount when given small raw amount', () => {
    const contextBoundarySmall =
        '5' + '0'.repeat(NEAR_NOMINATION_EXP - NEAR_FRACTIONAL_DIGITS - 1);
    const expectedValueSmall = '0.' + '0'.repeat(NEAR_FRACTIONAL_DIGITS - 1) + '1';

    expect(formatNearAmount(contextBoundarySmall)).toBe(expectedValueSmall);
});

test('formatNearAmount when given large raw amount', () => {
    expect(formatNearAmount(contextBig)).toBe('1,234.567');
});

/* showInYocto */

test('showInYocto when given 0', () => {
    expect(showInYocto(contextZeroAsProperString)).toBe('0 yoctoNEAR');
});

test('showInYocto when given new BN(0)', () => {
    expect(showInYocto(contextZeroAsBN)).toBe('0 yoctoNEAR');
});

test('showInYocto when given tiny raw amount', () => {
    expect(showInYocto(contextTiny)).toBe('123,456 yoctoNEAR');
});

test('showInYocto when given small raw amount', () => {
    expect(showInYocto(contextSmall)).toBe('10,000,000,000,000,000,000 yoctoNEAR');
});

test('showInYocto when given large raw amount', () => {
    expect(showInYocto(contextBig)).toBe(
        '1,234,567,000,000,000,000,000,000,000 yoctoNEAR'
    );
});

/* formatWithCommas */

test('formatWithCommas when given 0', () => {
    expect(formatWithCommas(contextZeroAsProperString)).toBe('0');
});

test('formatWithCommas when given tiny raw amount', () => {
    expect(formatWithCommas(contextTiny)).toBe('123,456');
});

test('formatWithCommas when given small raw amount', () => {
    expect(formatWithCommas(contextSmall)).toBe('10,000,000,000,000,000,000');
});

test('formatWithCommas when given large raw amount above threshold', () => {
    expect(formatWithCommas(contextBig)).toBe('1,234,567,000,000,000,000,000,000,000');
});
