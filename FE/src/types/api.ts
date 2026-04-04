import type { PlayerRole } from './gameplay';

export type ApiEnvelope<T> = {
    message: string;
    data: T;
};

export type UsersMeResponse = ApiEnvelope<{
    user: {
        id: string;
        email?: string;
        username?: string;
        winCount?: number;
        lossCount?: number;
        drawCount?: number;
        createdAt?: string;
    };
}>;

export type CreateRoomResponse = ApiEnvelope<{
    room: { code: string };
    hostPlayer: { id: string; role: PlayerRole };
}>;

export type JoinRoomResponse = ApiEnvelope<{
    room: { code: string };
    player: { id: string; role: PlayerRole };
}>;

export type RoomStateResponse = ApiEnvelope<{
    room: {
        code: string;
        codeLength: number;
        status: string;
        currentTurn: PlayerRole | null;
        currentRound: number;
        turnStartedAt?: string | null;
        endReason?: string | null;
        winnerRole?: PlayerRole | null;
    };
    players: Array<{
        id: string;
        nickname: string;
        role: PlayerRole;
        missCount: number;
    }>;
    lastGuess: {
        id: string;
        playerInRoomId: string;
        guessValue?: string;
        roundIndex: number;
        turnIndex: number;
        correctDigits: number;
        correctPositions: number;
        createdAt: string;
    } | null;
}>;

export type MessageOnlyResponse = { message: string };

export type AblyTokenResponse = ApiEnvelope<{
    token: string;
    expires: number;
}>;

export type HistoryItem = {
    code: string;
    status: string;
    endReason: string | null;
    winnerRole: PlayerRole | null;
    finishedAt: string | null;
    currentRound: number;
    players: Array<{ role: PlayerRole; nickname: string; userId?: string | null }>;
};

export type HistoryResponse = ApiEnvelope<{ items: HistoryItem[] }>;

export type RankItem = { rank: number; userId: string; username: string; wins: number };
export type RankResponse = ApiEnvelope<{ items: RankItem[] }>;

