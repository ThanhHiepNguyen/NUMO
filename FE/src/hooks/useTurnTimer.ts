import { useEffect, useState } from 'react';

export function useTurnTimer(playing: boolean, hasCurrentTurn: boolean, turnStartedAt: Date | null) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!playing || !hasCurrentTurn) return;

    const turnStartMs = turnStartedAt ? turnStartedAt.getTime() : Date.now();
    const tick = () => {
      const now = Date.now();
      const end = turnStartMs + 2 * 60 * 1000;
      const sec = Math.max(0, Math.floor((end - now) / 1000));
      setRemainingSeconds(sec);
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [playing, hasCurrentTurn, turnStartedAt]);

  const inactive = !playing || !hasCurrentTurn;
  const timerText = inactive
    ? '--:--'
    : `${String(Math.floor((remainingSeconds ?? 0) / 60)).padStart(2, '0')}:${String((remainingSeconds ?? 0) % 60).padStart(2, '0')}`;

  return { remainingSeconds, timerText };
}

