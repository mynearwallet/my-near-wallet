import { keepLastUniqueDataWithProperty } from './array';

describe('keepLastUniqueDataWithProperty', () => {
    test('should return correctly with duplicated token_id', () => {
        const arr = [
            {
                token_id: 2,
                name: 'Random name #14',
            },
            {
                token_id: 1,
                name: 'Random name #20',
            },
            {
                token_id: 3,
                name: 'Random name #21',
            },
            {
                token_id: 2,
                price: 7,
            },
            {
                token_id: 4,
                price: 19,
            },
            {
                token_id: 1,
                name: 'Random name #20',
            },
            {
                token_id: 3,
                name: 'Random name #21',
            },
            {
                token_id: 2,
                price: 7,
            },
            {
                token_id: 4,
                price: 19,
            },
        ];
        expect(keepLastUniqueDataWithProperty(arr, 'token_id')).toEqual([
            {
                token_id: 2,
                price: 7,
            },
            {
                token_id: 1,
                name: 'Random name #20',
            },
            {
                token_id: 3,
                name: 'Random name #21',
            },
            {
                token_id: 4,
                price: 19,
            },
        ]);
    });
});
