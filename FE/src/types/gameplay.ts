export type PlayerRole = 'PLAYER_1' | 'PLAYER_2';

export type RoomState = {
    code: string;
    codeLength: number;
    status: 'WAITING' | 'SETTING_SECRET' | 'PLAYING' | 'FINISHED' | string;
    currentTurn: PlayerRole | null;
    currentRound: number;
    turnStartedAt?: string | null;
    endReason?: string | null;
    winnerRole?: PlayerRole | null;
};

export type PlayerInRoom = {
    id: string;
    nickname: string;
    role: PlayerRole;
    missCount: number;
};

export type GuessLog = {
    id: string;
    playerInRoomId: string;
    guessValue?: string;
    correctDigits: number;
    correctPositions: number;
    createdAt?: string;
};

