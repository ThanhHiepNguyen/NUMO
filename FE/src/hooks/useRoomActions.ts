import { useCallback } from "react";
import { guess, leaveRoom, setSecret, startRoom } from "../lib/api";
import { isDigitsOnly, getErrorMessage } from "../utils/gameplay";

export function useRoomActions(params: {
  code?: string;
  effectivePlayerId: string;
  roomStatus?: string | null;
  currentTurn?: string | null;
  codeLength?: number;
  isMyTurn: boolean;
  loadState: (code: string) => Promise<void> | void;
  setError: (msg: string) => void;
  setMessage: (msg: string) => void;
  setSubmittingSecret: (v: boolean) => void;
  setSubmittingGuess: (v: boolean) => void;
  setSubmittingLeave: (v: boolean) => void;
  setMySecretPreview: (v: string) => void;
  setSecretValue: (v: string) => void;
}) {
  const {
    code,
    effectivePlayerId,
    roomStatus,
    currentTurn,
    codeLength,
    isMyTurn,
    loadState,
    setError,
    setMessage,
    setSubmittingSecret,
    setSubmittingGuess,
    setSubmittingLeave,
    setMySecretPreview,
    setSecretValue,
  } = params;

  const submitSecret = useCallback(
    async (secretValue: string) => {
      if (!code) return;
      if (!effectivePlayerId) {
        setError("Thiếu playerId. Hãy vào lại phòng từ màn hình Join/Create.");
        return;
      }
      if (roomStatus !== "SETTING_SECRET") {
        setError("Chưa tới bước nhập mật mã. Chủ phòng cần bấm BẮT ĐẦU.");
        return;
      }
      const normalized = secretValue.trim();
      if (!normalized) {
        setError("Vui lòng nhập mật mã");
        return;
      }
      if (!isDigitsOnly(normalized)) {
        setError("Mật mã chỉ được chứa chữ số");
        return;
      }
      if (typeof codeLength === "number" && normalized.length !== codeLength) {
        setError(`Mật mã phải có đúng ${codeLength} chữ số`);
        return;
      }
      try {
        setSubmittingSecret(true);
        setError("");
        const res = await setSecret(code, effectivePlayerId, normalized);
        setMessage(res?.message || "Đặt mật mã thành công");
        setMySecretPreview(normalized);
        setSecretValue("");
        await loadState(code);
      } catch (e: unknown) {
        setError(getErrorMessage(e, "Không đặt được mật mã"));
      } finally {
        setSubmittingSecret(false);
      }
    },
    [
      code,
      effectivePlayerId,
      roomStatus,
      codeLength,
      loadState,
      setError,
      setMessage,
      setSubmittingSecret,
      setMySecretPreview,
      setSecretValue,
    ],
  );

  const onStart = useCallback(async () => {
    if (!code) return;
    if (!effectivePlayerId) {
      setError("Thiếu playerId. Hãy vào lại phòng từ màn hình Join/Create.");
      return;
    }
    try {
      setError("");
      setMessage("");
      await startRoom(code, effectivePlayerId);
      await loadState(code);
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Không bắt đầu được"));
    }
  }, [code, effectivePlayerId, loadState, setError, setMessage]);

  const submitGuess = useCallback(
    async (guessValue: string) => {
      if (!code) return;
      if (roomStatus !== "PLAYING") {
        setError("Game chưa bắt đầu");
        return;
      }
      if (!effectivePlayerId) {
        setError("Chưa chọn player. Hãy chọn bạn là ai.");
        return;
      }
      if (!isMyTurn || !currentTurn) {
        setError("Chưa tới lượt của bạn");
        return;
      }
      const normalized = guessValue.trim();
      if (!normalized) {
        setError("Vui lòng nhập số để đoán");
        return;
      }
      if (!isDigitsOnly(normalized)) {
        setError("Chỉ được nhập chữ số");
        return;
      }
      if (typeof codeLength === "number" && normalized.length !== codeLength) {
        setError(`Bạn phải nhập đúng ${codeLength} chữ số`);
        return;
      }
      try {
        setSubmittingGuess(true);
        setError("");
        setMessage("");
        const res = await guess(code, effectivePlayerId, normalized);
        setMessage(res?.message || "Đoán thành công");
        await loadState(code);
      } catch (e: unknown) {
        setError(getErrorMessage(e, "Không đoán được"));
      } finally {
        setSubmittingGuess(false);
      }
    },
    [
      code,
      roomStatus,
      effectivePlayerId,
      isMyTurn,
      currentTurn,
      codeLength,
      loadState,
      setError,
      setMessage,
      setSubmittingGuess,
    ],
  );

  const onLeaveRoom = useCallback(async () => {
    if (!code || !effectivePlayerId) return;
    try {
      setSubmittingLeave(true);
      setError("");
      setMessage("");
      await leaveRoom(code, { playerId: effectivePlayerId });
      setMessage("Rời phòng thành công");
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Không rời phòng được"));
    } finally {
      setSubmittingLeave(false);
    }
  }, [code, effectivePlayerId, setSubmittingLeave, setError, setMessage]);

  const copyRoomCode = useCallback(async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setMessage("Đã copy mã phòng");
    } catch {
      setMessage("Không copy được. Hãy copy thủ công.");
    }
  }, [code, setMessage]);

  return { submitSecret, onStart, submitGuess, onLeaveRoom, copyRoomCode };
}
