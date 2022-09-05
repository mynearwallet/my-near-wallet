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
});

