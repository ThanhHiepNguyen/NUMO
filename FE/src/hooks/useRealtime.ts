import { useEffect } from 'react';
import * as Ably from 'ably';
import { getAblyToken } from '../lib/api';

export function useRealtime(roomCode: string | undefined, onEvent: () => void) {
  useEffect(() => {
    if (!roomCode) return;

    let disposed = false;
    let realtime: Ably.Realtime | null = null;

    const connectRealtime = async () => {
      try {
        const tokenRes = await getAblyToken(roomCode);
        const token = tokenRes?.data?.token;
        if (!token || disposed) return;

        realtime = new Ably.Realtime({ token });
        const channel = realtime.channels.get(`room:${roomCode}`);

        channel.subscribe(() => {
          if (disposed) return;
          onEvent();
        });
      } catch {
        // ignore
      }
    };

    void connectRealtime();

    return () => {
      disposed = true;
      if (realtime) realtime.close();
    };
  }, [roomCode, onEvent]);
}

