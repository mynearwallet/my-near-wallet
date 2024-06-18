import { keysToSnakeCase } from './object';

describe('keysToSnakeCase', () => {
    test('should return snakeCase', () => {
        expect(
            keysToSnakeCase({
                keyRaw: 1,
            })
        ).toStrictEqual({
            key_raw: 1,
        });
    });
});
