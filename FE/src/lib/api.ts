import axios, { AxiosError } from 'axios';

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

type Role = 'PLAYER_1' | 'PLAYER_2';

type ApiEnvelope<T> = {
  message: string;
  data: T;
};

type AuthMeResponse = ApiEnvelope<{
  user: {
    id: string;
    email?: string;
    username?: string;
  };
}>;

type CreateRoomResponse = ApiEnvelope<{
  room: { code: string };
  hostPlayer: { id: string; role: Role };
}>;

type JoinRoomResponse = ApiEnvelope<{
  room: { code: string };
  player: { id: string; role: Role };
}>;

type RoomStateResponse = ApiEnvelope<{
  room: {
    code: string;
    codeLength: number;
    status: string;
    currentTurn: Role | null;
    currentRound: number;
    turnStartedAt?: string | null;
    endReason?: string | null;
    winnerRole?: Role | null;
  };
  players: Array<{
    id: string;
    nickname: string;
    role: Role;
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

type MessageOnlyResponse = { message: string };
type AblyTokenResponse = ApiEnvelope<{
  token: string;
  expires: number;
}>;

function toErrorMessage(err: unknown) {
  const ax = err as AxiosError<{ message?: unknown }>;
  const apiMessage = ax?.response?.data?.message;
  const msg =
    (typeof apiMessage === 'string' ? apiMessage : undefined) ||
    ax?.message ||
    'Request failed';
  return typeof msg === 'string' ? msg : JSON.stringify(msg);
}

async function get<T>(path: string): Promise<T> {
  try {
    const res = await axios.get<T>(`${API_BASE}${path}`, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return res.data;
  } catch (e) {
    throw new Error(toErrorMessage(e));
  }
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  try {
    const res = await axios.post<T>(`${API_BASE}${path}`, body, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return res.data;
  } catch (e) {
    throw new Error(toErrorMessage(e));
  }
}

export function authLogin(payload: { email: string; password: string }) {
  return post<MessageOnlyResponse>('/auth/login', payload);
}

export function authRegister(payload: {
  email: string;
  password: string;
  username: string;
}) {
  return post<MessageOnlyResponse>('/auth/register', payload);
}

export function authLogout() {
  return post<MessageOnlyResponse>('/auth/logout');
}

export function authMe() {
  return get<AuthMeResponse>('/auth/me');
}

export function createRoom(payload: { codeLength: number; maxRounds: number }) {
  return post<CreateRoomResponse>('/rooms', payload);
}

export function joinRoom(code: string, payload: { nickname: string }) {
  return post<JoinRoomResponse>(`/rooms/${encodeURIComponent(code)}/join`, payload);
}

export function getRoomState(code: string) {
  return get<RoomStateResponse>(`/rooms/${encodeURIComponent(code)}/state`);
}

export function setSecret(code: string, playerId: string, secretCode: string) {
  return post<MessageOnlyResponse>(`/rooms/${encodeURIComponent(code)}/players/${encodeURIComponent(playerId)}/secret`, {
    secretCode,
  });
}

export function guess(code: string, playerId: string, guessValue: string) {
  return post<MessageOnlyResponse>(`/rooms/${encodeURIComponent(code)}/players/${encodeURIComponent(playerId)}/guess`, {
    guessValue,
  });
}

export function startRoom(code: string, playerId: string) {
  return post<MessageOnlyResponse>(`/rooms/${encodeURIComponent(code)}/players/${encodeURIComponent(playerId)}/start`);
}

export function leaveRoom(code: string, payload: { playerId: string }) {
  return post<MessageOnlyResponse>(`/rooms/${encodeURIComponent(code)}/leave`, payload);
}

export function getAblyToken(code: string) {
  return get<AblyTokenResponse>(`/realtime/ably-token?roomCode=${encodeURIComponent(code)}`);
}
