import { useEffect } from "react";
import type { GuessLog } from "../types/gameplay";
import { toCachedGuessLogs } from "../utils/gameplay";

export function useSessionCache(
  sessionKey: string | "",
  deps: {
    mySecretPreview: string;
    setMySecretPreview: (v: string) => void;
    lastSubmittedGuess: string;
    setLastSubmittedGuess: (v: string) => void;
    guessLogs: GuessLog[];
    setGuessLogs: (v: GuessLog[]) => void;
  },
) {
  const {
    mySecretPreview,
    setMySecretPreview,
    lastSubmittedGuess,
    setLastSubmittedGuess,
    guessLogs,
    setGuessLogs,
  } = deps;

  useEffect(() => {
    if (!sessionKey) return;
    try {
      const raw = window.sessionStorage.getItem(sessionKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        mySecretPreview?: unknown;
        lastSubmittedGuess?: unknown;
        guessLogs?: unknown;
      };
      if (typeof parsed.mySecretPreview === "string") {
        setMySecretPreview(parsed.mySecretPreview);
      }
      if (typeof parsed.lastSubmittedGuess === "string") {
        setLastSubmittedGuess(parsed.lastSubmittedGuess);
      }
      const cachedLogs = toCachedGuessLogs(parsed.guessLogs);
      if (cachedLogs.length) {
        setGuessLogs(cachedLogs);
      }
    } catch {
      window.sessionStorage.removeItem(sessionKey);
    }
  }, [sessionKey, setMySecretPreview, setLastSubmittedGuess, setGuessLogs]);

  useEffect(() => {
    if (!sessionKey) return;
    const payload = {
      mySecretPreview,
      lastSubmittedGuess,
      guessLogs,
    };
    window.sessionStorage.setItem(sessionKey, JSON.stringify(payload));
  }, [sessionKey, mySecretPreview, lastSubmittedGuess, guessLogs]);

  useEffect(() => {
    // clear when needed handled outside; helper if caller sets empty sessionKey
    if (!sessionKey) return;
    return () => {
      // no-op
    };
  }, [sessionKey]);
}
