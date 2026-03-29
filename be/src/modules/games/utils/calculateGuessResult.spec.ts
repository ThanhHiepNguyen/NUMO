import { calculateGuessResult } from './calculateGuessResult';

describe('calculateGuessResult', () => {
    const testCases = [
        { secret: '2344', guess: '4564', expected: { digits: 2, pos: 1 } },
        { secret: '2344', guess: '4444', expected: { digits: 2, pos: 2 } },
        { secret: '1203', guess: '3012', expected: { digits: 4, pos: 0 } },
        { secret: '1123', guess: '1111', expected: { digits: 2, pos: 2 } },
        { secret: '5050', guess: '5005', expected: { digits: 4, pos: 2 } },
        { secret: '5987', guess: '1978', expected: { digits: 3, pos: 1 } },
    ];

    it.each(testCases)(
        'secret=$secret guess=$guess => digits=$expected.digits pos=$expected.pos',
        ({ secret, guess, expected }) => {
            const result = calculateGuessResult(guess, secret);

            expect(result.correctDigits).toBe(expected.digits);
            expect(result.correctPositions).toBe(expected.pos);
        },
    );
});
