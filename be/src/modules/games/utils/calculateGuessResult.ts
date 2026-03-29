export function calculateGuessResult(secret: string, guess: string) {
    let correctPositions: number = 0;
    let correctDigits: number = 0;

    const secretFrequencies: Record<string, number> = {};

    for (let i = 0; i < secret.length; i++) {
        const sChar = secret[i];
        const gChar = guess[i];

        if (sChar === gChar) {
            correctPositions++;
            correctDigits++;
        } else {
            secretFrequencies[sChar] = (secretFrequencies[sChar] || 0) + 1;
        }
    }


    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === secret[i]) {
            continue;
        }

        const gChar = guess[i];
        if (secretFrequencies[gChar] && secretFrequencies[gChar] > 0) {
            correctDigits++;
            secretFrequencies[gChar]--;
        }
    }

    return { correctDigits, correctPositions };
}