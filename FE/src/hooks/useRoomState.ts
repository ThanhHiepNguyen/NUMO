import { useCallback, useState } from 'react';
import { getRoomState } from '../lib/api';
import type { RoomState, PlayerInRoom, GuessLog } from '../types/gameplay';

export function useRoomState() {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [players, setPlayers] = useState<PlayerInRoom[]>([]);
  const [guessLogs, setGuessLogs] = useState<GuessLog[]>([]);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [error, setError] = useState('');

  const loadState = useCallback(async (code: string) => {
    try {
      if (!loadedOnce) setLoadingRoom(true);
      const res = await getRoomState(code);
      const nextRoom = (res?.data?.room ?? null) as RoomState | null;
      const nextPlayers = (Array.isArray(res?.data?.players) ? res.data.players : []) as PlayerInRoom[];
      const lastGuess = (res?.data?.lastGuess ?? null) as GuessLog | null;

      setRoom(nextRoom);
      setPlayers(nextPlayers);
      if (lastGuess?.id) {
        setGuessLogs((prev) => (prev.some((g) => g.id === lastGuess.id) ? prev : [lastGuess, ...prev]));
      }
      if (!loadedOnce) setLoadedOnce(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Không lấy được trạng thái phòng';
      setError(msg);
    } finally {
      if (!loadedOnce) setLoadingRoom(false);
    }
  }, [loadedOnce]);

  return {
    room,
    players,
    guessLogs,
    setGuessLogs,
    loadingRoom,
    loadedOnce,
    error,
    setError,
    loadState,
  };
}

