import * as amounts from './amounts';

describe('amounts', () => {
    test('should correctly decrease amount by percent', () => {
        expect(amounts.decreaseByPercent(100, 10)).toBe('90');
        expect(amounts.decreaseByPercent(250, 10)).toBe('225');
        expect(amounts.decreaseByPercent(930, 40)).toBe('558');
        expect(amounts.decreaseByPercent(42.2, 15.4)).toBe('36');
        expect(amounts.decreaseByPercent(0.000079630313987476842385, 0.1, 10)).toBe('0.0000795507');
        expect(amounts.decreaseByPercent(0.000079630313987476842385, 0.1, 18)).toBe('0.000079550683673489');
    });

    test('should correcly cut specified amount of decimal places if necessary', () => {
        expect(amounts.cutDecimalsIfNeeded(1)).toBe('1');
        expect(amounts.cutDecimalsIfNeeded(1.1)).toBe('1.1');
        expect(amounts.cutDecimalsIfNeeded(1.1, 3)).toBe('1.1');
        expect(amounts.cutDecimalsIfNeeded(1.00005, 2)).toBe('1.00005');
        expect(amounts.cutDecimalsIfNeeded(1.12345, 2)).toBe('1.12');
        expect(amounts.cutDecimalsIfNeeded(1.0123456789, 4)).toBe('1.0123');
    });

    test('should correcly get specified percent from the amount', () => {
        expect(amounts.getPercentFrom(100, 100)).toBe('100');
        expect(amounts.getPercentFrom(100, 10)).toBe('10');
        expect(amounts.getPercentFrom(100, 60)).toBe('60');
        expect(amounts.getPercentFrom(100, 0)).toBe('0');
        expect(amounts.getPercentFrom(5, 10)).toBe('0.5');
        expect(amounts.getPercentFrom(1, 0.3)).toBe('0.003');
        expect(amounts.getPercentFrom(1, 0.003)).toBe('0.00003');
    });
});

