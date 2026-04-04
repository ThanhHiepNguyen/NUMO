import axios, { AxiosError } from 'axios';
import type {
  UsersMeResponse,
  CreateRoomResponse,
  JoinRoomResponse,
  RoomStateResponse,
  MessageOnlyResponse,
  AblyTokenResponse,
  HistoryResponse,
  RankResponse,
} from '../types/api';


export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';



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

export function authVerifyOtp(payload: { email: string; code: string }) {
  return post<{ accessToken: string; message: string }>('/auth/verify-otp', payload);
}

export function authResendOtp(payload: { email: string }) {
  return post<MessageOnlyResponse>('/auth/resend-otp', payload);
}

export function authLogout() {
  return post<MessageOnlyResponse>('/auth/logout');
}

export function usersMe() {
  return get<UsersMeResponse>('/users/me');
}

export function changePassword(payload: { oldPassword: string; newPassword: string }) {
  return post<MessageOnlyResponse>('/users/change-password', payload);
}

export function changeUsername(payload: { username: string }) {
  return post<MessageOnlyResponse>('/users/change-username', payload);
}

export function getHistory(limit = 10) {
  return get<HistoryResponse>(`/users/history?limit=${encodeURIComponent(String(limit))}`);
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

export function getRank(limit = 20) {
  return get<RankResponse>(`/users/rank?limit=${encodeURIComponent(String(limit))}`);
}
