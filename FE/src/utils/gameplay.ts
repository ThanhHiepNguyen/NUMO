import type { GuessLog } from '../types/gameplay';

export function isDigitsOnly(value: string): boolean {
  return /^\d+$/.test(value);
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function toCachedGuessLogs(input: unknown): GuessLog[] {
  if (!Array.isArray(input)) return [];
  return input.filter((item): item is GuessLog => {
    if (!item || typeof item !== 'object') return false;
    const row = item as Partial<GuessLog>;
    return typeof row.id === 'string' && typeof row.playerInRoomId === 'string';
  });
}

