import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import * as Ably from 'ably';
import { Clock, Crosshair, LogOut, Send, ShieldAlert } from 'lucide-react';
import { getAblyToken, getRoomState, guess, leaveRoom, setSecret, startRoom } from '../lib/api';
import { useAuth } from '../state/auth';

type PlayerRole = 'PLAYER_1' | 'PLAYER_2';

type RouteState = {
    playerId?: string;
    role?: PlayerRole;
    nickname?: string;
};

type RoomState = {
    code: string;
    codeLength: number;
    status: 'WAITING' | 'SETTING_SECRET' | 'PLAYING' | 'FINISHED' | string;
    currentTurn: PlayerRole | null;
    currentRound: number;
    turnStartedAt?: string | null;
    endReason?: string | null;
    winnerRole?: PlayerRole | null;
};

type PlayerInRoom = {
    id: string;
    nickname: string;
    role: PlayerRole;
    missCount: number;
};

type GuessLog = {
    id: string;
    playerInRoomId: string;
    guessValue?: string;
    correctDigits: number;
    correctPositions: number;
    createdAt?: string;
};

const POLL_INTERVAL_MS = 8000;

function isDigitsOnly(value: string) {
    return /^\d+$/.test(value);
}

function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error && error.message) return error.message;
    return fallback;
}

function toCachedGuessLogs(input: unknown): GuessLog[] {
    if (!Array.isArray(input)) return [];
    return input.filter((item): item is GuessLog => {
        if (!item || typeof item !== 'object') return false;
        const row = item as Partial<GuessLog>;
        return typeof row.id === 'string' && typeof row.playerInRoomId === 'string';
    });
}

export default function GameplayPage() {
    const nav = useNavigate();
    const location = useLocation();
    const { code } = useParams<{ code: string }>();
    const { displayName } = useAuth();

    const roomCode = code || '------';
    const routeState = (location.state ?? {}) as RouteState;

    const [room, setRoom] = useState<RoomState | null>(null);
    const [players, setPlayers] = useState<PlayerInRoom[]>([]);
    const [loadingRoom, setLoadingRoom] = useState(false);
    const [loadedOnce, setLoadedOnce] = useState(false);
    const [lastSnapshot, setLastSnapshot] = useState('');
    const [guessLogs, setGuessLogs] = useState<GuessLog[]>([]);
    const [secretValue, setSecretValue] = useState('');
    const [submittingSecret, setSubmittingSecret] = useState(false);
    const [submittingGuess, setSubmittingGuess] = useState(false);
    const [submittingLeave, setSubmittingLeave] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [lastSubmittedGuess, setLastSubmittedGuess] = useState('');
    const [mySecretPreview, setMySecretPreview] = useState('');
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

    const [guessValue, setGuessValue] = useState('');
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');

    const loadState = async () => {
        if (!code) return;
        try {
            if (!loadedOnce) setLoadingRoom(true);
            const res = await getRoomState(code);
            const nextRoom = (res?.data?.room ?? null) as RoomState | null;
            const nextPlayers = (Array.isArray(res?.data?.players) ? res.data.players : []) as PlayerInRoom[];
            const lastGuess = (res?.data?.lastGuess ?? null) as GuessLog | null;
            const snapshot = JSON.stringify({ room: nextRoom, players: nextPlayers });


            if (snapshot !== lastSnapshot) {
                setRoom(nextRoom);
                setPlayers(nextPlayers);
                setLastSnapshot(snapshot);
            }
            if (lastGuess?.id) {
                setGuessLogs((prev) => {
                    if (prev.some((g) => g.id === lastGuess.id)) return prev;
                    return [lastGuess, ...prev];
                });
            }
            if (!loadedOnce) setLoadedOnce(true);
        } catch (e: unknown) {
            setError(getErrorMessage(e, 'Không lấy được trạng thái phòng'));
        } finally {
            if (!loadedOnce) setLoadingRoom(false);
        }
    };

    useEffect(() => {
        void loadState();
        if (!code) return;
        let id: ReturnType<typeof window.setInterval> | null = window.setInterval(() => {
            void loadState();
        }, POLL_INTERVAL_MS);

        const onVis = () => {

            if (document.visibilityState === 'hidden') {
                if (id) window.clearInterval(id);
                id = null;
                return;
            }
            if (!id) {
                void loadState();
                id = window.setInterval(() => {
                    void loadState();
                }, POLL_INTERVAL_MS);
            }
        };

        document.addEventListener('visibilitychange', onVis);
        return () => {
            if (id) window.clearInterval(id);
            document.removeEventListener('visibilitychange', onVis);
        };
    }, [code, loadedOnce, lastSnapshot]);

    useEffect(() => {
        if (!code) return;

        let disposed = false;
        let realtime: Ably.Realtime | null = null;

        const connectRealtime = async () => {
            try {
                const tokenRes = await getAblyToken(code);
                const token = tokenRes?.data?.token;
                if (!token || disposed) return;

                realtime = new Ably.Realtime({ token });
                const channel = realtime.channels.get(`room:${code}`);

                channel.subscribe(() => {
                    if (disposed) return;
                    void loadState();
                });
            } catch {}
        };

        void connectRealtime();

        return () => {
            disposed = true;
            if (realtime) realtime.close();
        };
    }, [code, loadedOnce, lastSnapshot]);

    useEffect(() => {
        if (routeState.playerId && routeState.playerId !== selectedPlayerId) {
            setSelectedPlayerId(routeState.playerId);
        }
    }, [routeState.playerId, selectedPlayerId, players.length]);

    const effectivePlayerId = selectedPlayerId || routeState.playerId || '';
    const sessionCacheKey = code
        ? `numo:match:${code}:player:${effectivePlayerId || 'unknown'}`
        : '';
    const myPlayer = players.find((p) => p.id === effectivePlayerId) || null;
    const myRole = (myPlayer?.role || routeState.role || null) as PlayerRole | null;
    const playerRoleById: Record<string, string> = {};
    const playerNameById: Record<string, string> = {};
    for (const p of players) playerRoleById[p.id] = p.role;
    for (const p of players) playerNameById[p.id] = p.nickname;

    const myGuessLogs = guessLogs.filter((g) => g.playerInRoomId === effectivePlayerId);
    const opponentGuessLogs = guessLogs.filter((g) => g.playerInRoomId !== effectivePlayerId);
    const canStart =
        myRole === 'PLAYER_1' &&
        players.length === 2 &&
        room?.status === 'WAITING';
    const playerOneName = players.find((p) => p.role === 'PLAYER_1')?.nickname || 'Đang chờ...';
    const playerTwoName = players.find((p) => p.role === 'PLAYER_2')?.nickname || 'Đang chờ...';

    const secretPhase = room?.status === 'SETTING_SECRET';
    const playingPhase = room?.status === 'PLAYING';
    const finishedPhase = room?.status === 'FINISHED';
    const waitingPhase = room?.status === 'WAITING';
    const isMyTurn = playingPhase && !!myRole && room?.currentTurn === myRole;
    const turnStatusText = playingPhase
        ? (isMyTurn ? 'Đến lượt của bạn' : 'Chờ đối thủ...')
        : (room?.status || 'Chờ đồng bộ trạng thái...');
    const turnStartedAt = room?.turnStartedAt ? new Date(room.turnStartedAt) : null;

    const winnerRole = room?.winnerRole as PlayerRole | null | undefined;
    const didIWin = !!myRole && winnerRole === myRole;
    const isTie = !winnerRole;

    useEffect(() => {
        if (!sessionCacheKey) return;
        try {
            const raw = window.sessionStorage.getItem(sessionCacheKey);
            if (!raw) return;
            const parsed = JSON.parse(raw) as {
                mySecretPreview?: unknown;
                lastSubmittedGuess?: unknown;
                guessLogs?: unknown;
            };
            if (typeof parsed.mySecretPreview === 'string') {
                setMySecretPreview(parsed.mySecretPreview);
            }
            if (typeof parsed.lastSubmittedGuess === 'string') {
                setLastSubmittedGuess(parsed.lastSubmittedGuess);
            }
            const cachedLogs = toCachedGuessLogs(parsed.guessLogs);
            if (cachedLogs.length) {
                setGuessLogs(cachedLogs);
            }
        } catch {
            window.sessionStorage.removeItem(sessionCacheKey);
        }
    }, [sessionCacheKey]);

    useEffect(() => {
        if (!sessionCacheKey) return;
        const cachePayload = {
            mySecretPreview,
            lastSubmittedGuess,
            guessLogs,
        };
        window.sessionStorage.setItem(sessionCacheKey, JSON.stringify(cachePayload));
    }, [sessionCacheKey, mySecretPreview, lastSubmittedGuess, guessLogs]);

    useEffect(() => {
        if (!finishedPhase || !sessionCacheKey) return;
        window.sessionStorage.removeItem(sessionCacheKey);
    }, [finishedPhase, sessionCacheKey]);

    useEffect(() => {
        if (!playingPhase || !room?.currentTurn) {
            setRemainingSeconds(null);
            return;
        }

        const turnStartMs = turnStartedAt?.getTime() ?? Date.now();

        const tick = () => {
            const now = Date.now();
            const end = turnStartMs + 2 * 60 * 1000;
            const sec = Math.max(0, Math.floor((end - now) / 1000));
            setRemainingSeconds(sec);
        };

        // Reset immediately when turn changes.
        tick();
        const id = window.setInterval(tick, 1000);
        return () => window.clearInterval(id);
    }, [playingPhase, room?.currentTurn, room?.turnStartedAt]);

    const timerText =
        remainingSeconds === null
            ? '--:--'
            : `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;
    const displayTimerText = isMyTurn ? timerText : '--:--';

    const submitSecret = async () => {
        if (!code) return;
        if (!routeState.playerId) {
            setError('Thiếu playerId. Hãy vào lại phòng từ màn hình Join/Create.');
            return;
        }
        if (!secretPhase) {
            setError('Chưa tới bước nhập mật mã. Chủ phòng cần bấm BẮT ĐẦU.');
            return;
        }
        const normalized = secretValue.trim();
        const codeLength = room?.codeLength;
        if (!normalized) {
            setError('Vui lòng nhập mật mã');
            return;
        }
        if (!isDigitsOnly(normalized)) {
            setError('Mật mã chỉ được chứa chữ số');
            return;
        }
        if (typeof codeLength === 'number' && normalized.length !== codeLength) {
            setError(`Mật mã phải có đúng ${codeLength} chữ số`);
            return;
        }

        try {
            setSubmittingSecret(true);
            setError('');
            const res = await setSecret(code, routeState.playerId, normalized);
            setMessage(res?.message || 'Đặt mật mã thành công');
            setMySecretPreview(normalized);
            setSecretValue('');
            await loadState();
        } catch (e: unknown) {
            setError(getErrorMessage(e, 'Không đặt được mật mã'));
        } finally {
            setSubmittingSecret(false);
        }
    };

    const onStart = async () => {
        if (!code) return;
        if (!routeState.playerId) {
            setError('Thiếu playerId. Hãy vào lại phòng từ màn hình Join/Create.');
            return;
        }
        try {
            setError('');
            setMessage('');
            await startRoom(code, routeState.playerId);
            await loadState();
        } catch (e: unknown) {
            setError(getErrorMessage(e, 'Không bắt đầu được'));
        }
    };

    const submitGuess = async () => {
        if (!code) return;
        if (!playingPhase) {
            setError('Game chưa bắt đầu');
            return;
        }
        if (!effectivePlayerId) {
            setError('Chưa chọn player. Hãy chọn bạn là ai.');
            return;
        }
        if (!isMyTurn) {
            setError('Chưa tới lượt của bạn');
            return;
        }

        const normalized = guessValue.trim();
        const codeLength = room?.codeLength;
        if (!normalized) {
            setError('Vui lòng nhập số để đoán');
            return;
        }
        if (!isDigitsOnly(normalized)) {
            setError('Chỉ được nhập chữ số');
            return;
        }
        if (typeof codeLength === 'number' && normalized.length !== codeLength) {
            setError(`Bạn phải nhập đúng ${codeLength} chữ số`);
            return;
        }

        try {
            setSubmittingGuess(true);
            setError('');
            setMessage('');
            const res = await guess(code, effectivePlayerId, normalized);
            setMessage(res?.message || 'Đoán thành công');
            setLastSubmittedGuess(normalized);
            setGuessValue('');
            await loadState();
        } catch (e: unknown) {
            setError(getErrorMessage(e, 'Không đoán được'));
        } finally {
            setSubmittingGuess(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void submitGuess();
    };

    const copyRoomCode = async () => {
        if (!code) return;
        try {
            await navigator.clipboard.writeText(code);
            setMessage('Đã copy mã phòng');
        } catch {
            setMessage('Không copy được. Hãy copy thủ công.');
        }
    };

    const renderPlayerSelector = (className = 'rounded-md border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200') => {
        if (effectivePlayerId || !players.length) return null;

        return (
            <div className={className}>
                <p className="font-semibold">Bạn là ai? (refresh sẽ mất playerId)</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    {players.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedPlayerId(p.id)}
                            className="rounded border border-amber-300/30 bg-[#030B1B]/40 px-3 py-2 text-xs font-bold tracking-[0.12em] text-amber-100 hover:border-amber-200"
                        >
                            {p.nickname} ({p.role})
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const onLeaveRoom = async () => {
        if (!code) {
            nav('/');
            return;
        }
        if (!effectivePlayerId) {
            nav('/');
            return;
        }
        try {
            setSubmittingLeave(true);
            setError('');
            setMessage('');
            const res = await leaveRoom(code, { playerId: effectivePlayerId });
            setMessage(res?.message || 'Rời phòng thành công');
            if (sessionCacheKey) window.sessionStorage.removeItem(sessionCacheKey);
            nav('/');
        } catch (e: unknown) {
            setError(getErrorMessage(e, 'Không rời phòng được'));
        } finally {
            setSubmittingLeave(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030B1B] px-2 py-2 text-slate-100 sm:px-5 sm:py-3 flex items-center justify-center">
            {finishedPhase ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
                    <div className={`w-full max-w-md rounded-xl border p-5 text-sm shadow-2xl ${isTie
                        ? 'border-amber-400/40 bg-[#1A1408] text-amber-200'
                        : didIWin
                            ? 'border-emerald-400/40 bg-[#081A12] text-emerald-200'
                            : 'border-rose-400/40 bg-[#1A0A10] text-rose-200'
                        }`}>
                        <p className="text-xs uppercase tracking-[0.16em] opacity-80">Kết quả trận đấu</p>
                        <p className="mt-1 text-2xl font-bold">
                            {isTie ? 'HÒA' : didIWin ? 'BẠN THẮNG' : 'BẠN THUA'}
                        </p>
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={() => nav('/')}
                                className="w-full rounded border border-slate-200/30 bg-[#030B1B]/30 px-3 py-2 text-xs font-bold tracking-[0.12em] text-slate-100 hover:border-slate-100/50"
                            >
                                GO HOME
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
            <div className="w-full max-w-5xl rounded-2xl border border-indigo-500/50 bg-[#071329] shadow-[0_0_0_1px_rgba(99,102,241,0.3),0_0_40px_rgba(59,130,246,0.12)] flex flex-col h-[92vh] sm:h-[85vh] overflow-hidden">
                <header className="flex flex-col gap-3 border-b border-indigo-500/20 bg-[#09172E] px-3 py-3 sm:px-6 sm:py-4">
                    <div className="w-full px-3 py-2 rounded-sm border flex items-center justify-center gap-2 transition-all border-slate-700 bg-slate-800/50 text-slate-400 sm:px-8 sm:py-2.5">
                        <Crosshair className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.18em]">
                            {turnStatusText}
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <ShieldAlert className="h-5 w-5 text-indigo-400" />
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                                    Mã phòng
                                </p>
                                <p className="font-mono text-base font-bold text-cyan-300 tracking-[0.2em] sm:text-xl sm:tracking-widest">
                                    {roomCode}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1">
                                    Bạn: {displayName || 'Guest'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            {canStart ? (
                                <button
                                    onClick={() => void onStart()}
                                    className="rounded border border-emerald-400/40 bg-emerald-400/10 px-2 py-1.5 text-[10px] font-bold tracking-[0.1em] text-emerald-200 hover:border-emerald-300 sm:px-3 sm:py-2 sm:text-[11px] sm:tracking-[0.14em]"
                                >
                                    BẮT ĐẦU
                                </button>
                            ) : null}
                            <div className="flex items-center gap-1.5 text-rose-400 sm:gap-2">
                                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                                <span className="font-mono text-base font-bold sm:text-xl">{displayTimerText}</span>
                            </div>
                            <button
                                onClick={() => void onLeaveRoom()}
                                disabled={submittingLeave}
                                title="Rời phòng"
                                aria-label="Rời phòng"
                                className="rounded border border-rose-400/35 bg-rose-400/10 px-2 py-1.5 text-[10px] font-bold tracking-[0.1em] text-rose-200 hover:border-rose-300 disabled:opacity-50 sm:px-3 sm:py-2 sm:text-[11px]"
                            >
                                {submittingLeave ? '...' : <LogOut className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 bg-slate-800/50 overflow-y-auto">
                    {waitingPhase ? (
                        <div className="p-4 sm:p-6">
                            <div className="rounded-xl border border-indigo-500/20 bg-[#050C1A]/60 p-5 shadow-[0_0_0_1px_rgba(99,102,241,0.18)]">
                                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Phòng chờ</p>
                                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-200">Mã phòng</p>
                                        <p className="mt-1 font-mono text-2xl font-bold tracking-[0.28em] text-cyan-300">
                                            {roomCode}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => void copyRoomCode()}
                                        className="rounded border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-bold tracking-[0.14em] text-cyan-100 hover:border-cyan-300"
                                    >
                                        COPY MÃ PHÒNG
                                    </button>
                                </div>

                                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="rounded-lg border border-slate-800/70 bg-slate-900/20 p-4">
                                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Người chơi 1</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-200">
                                            {playerOneName}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-slate-800/70 bg-slate-900/20 p-4">
                                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Người chơi 2</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-200">
                                            {playerTwoName}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 rounded-lg border border-slate-800/70 bg-slate-900/20 p-4 text-sm text-slate-300">
                                    <p>
                                        Mời bạn vào phòng bằng <b>mã phòng</b> ở trên. Khi đủ 2 người, <b>chủ phòng</b> bấm <b>BẮT ĐẦU</b>.
                                    </p>
                                </div>

                                {renderPlayerSelector('mt-4 rounded-md border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200')}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-800/50 md:overflow-hidden">
                            <section className="bg-[#071329] p-4 sm:p-6 flex flex-col h-full">
                                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300 flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-cyan-300"></span>
                                        Bảng của bạn
                                    </h2>
                                    {mySecretPreview ? (
                                        <div className="rounded-md border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100">
                                            <span className="hidden sm:inline">Mật mã của bạn: </span>
                                            <span className="font-mono font-bold tracking-[0.18em]">{mySecretPreview}</span>
                                        </div>
                                    ) : null}
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                    {secretPhase ? (
                                        <div className="rounded-md border border-slate-800/70 bg-slate-900/20 p-4 text-sm">
                                            <p className="mb-2 text-slate-300 font-semibold uppercase tracking-[0.12em]">
                                                Nhập mật mã
                                            </p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={secretValue}
                                                    onChange={(e) => setSecretValue(e.target.value.replace(/\D/g, ''))}
                                                    placeholder={`Nhập ${room?.codeLength ?? '?'} chữ số`}
                                                    className="w-full rounded border border-slate-700 bg-[#030B1B] px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                                                />
                                                <button
                                                    onClick={() => void submitSecret()}
                                                    disabled={submittingSecret || !routeState.playerId}
                                                    className="rounded bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                                                >
                                                    {submittingSecret ? '...' : 'GỬI'}
                                                </button>
                                            </div>
                                            {!routeState.playerId ? (
                                                <p className="mt-2 text-xs text-amber-300">
                                                    Thiếu playerId, vui lòng vào lại phòng từ Join/Create.
                                                </p>
                                            ) : null}
                                        </div>
                                    ) : (
                                        <div className="rounded-md border border-slate-800/70 bg-slate-900/20 p-4 text-sm text-slate-400">
                                            {room?.status === 'PLAYING' ? (
                                                <p>Game đã bắt đầu. Nhập số ở dưới để đoán.</p>
                                            ) : (
                                                <p>Đang chờ...</p>
                                            )}
                                        </div>
                                    )}

                                    {renderPlayerSelector()}

                                    {lastSubmittedGuess ? (
                                        <div className="rounded-md border border-indigo-400/25 bg-indigo-400/10 p-4 text-sm text-indigo-100">
                                            Bạn vừa đoán: <span className="font-mono font-bold tracking-[0.18em]">{lastSubmittedGuess}</span>
                                        </div>
                                    ) : null}

                                    {myGuessLogs.length ? (
                                        <div className="rounded-md border border-slate-800/70 bg-slate-900/20 p-4 text-sm text-slate-300">
                                            <p className="mb-2 font-semibold uppercase tracking-[0.12em]">Lịch sử đoán của bạn</p>
                                            <div className="space-y-2">
                                                {myGuessLogs.map((g) => (
                                                    <div key={g.id} className="flex items-center justify-between rounded border border-slate-800/70 bg-[#030B1B]/40 px-3 py-2">
                                                        <span className="font-mono tracking-[0.18em]">{g.guessValue || '----'}</span>
                                                        <span className="text-xs text-slate-300">
                                                            Đúng {g.correctDigits} số | Đúng {g.correctPositions} vị trí
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </section>

                            <section className="bg-[#050C1A] p-4 sm:p-6 flex flex-col h-full opacity-90">
                                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-rose-300 mb-6 flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-rose-400"></span>
                                    Bảng đối thủ
                                </h2>
                                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                    {opponentGuessLogs.length ? (
                                        <div className="rounded-md border border-slate-800/70 bg-slate-900/20 p-4 text-sm text-slate-300">
                                            <p className="mb-2 font-semibold uppercase tracking-[0.12em]">Lịch sử đoán đối thủ</p>
                                            <div className="space-y-2">
                                                {opponentGuessLogs.map((g) => (
                                                    <div key={g.id} className="flex items-center justify-between rounded border border-slate-800/70 bg-[#030B1B]/30 px-3 py-2">
                                                        <span className="font-mono tracking-[0.18em]">{g.guessValue || '----'}</span>
                                                        <span className="text-xs text-slate-400">
                                                            {playerNameById[g.playerInRoomId] || playerRoleById[g.playerInRoomId] || 'Người chơi'} | Đúng {g.correctDigits} số | Đúng {g.correctPositions} vị trí
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-md border border-slate-800/70 bg-slate-900/20 p-4 text-sm text-slate-500">
                                            Chưa có dữ liệu.
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    )}
                </main>

                {playingPhase ? (
                    <footer className="border-t border-indigo-500/20 bg-[#09172E] p-3 sm:p-6">
                        <form onSubmit={handleSubmit} className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row sm:gap-4">
                            <input
                                type="text"
                                maxLength={room?.codeLength ?? 6}
                                value={guessValue}
                                onChange={(e) => setGuessValue(e.target.value.replace(/\D/g, ''))}
                                disabled={finishedPhase || !playingPhase || !effectivePlayerId || !isMyTurn || submittingGuess}
                                placeholder={
                                    finishedPhase
                                        ? 'Trận đã kết thúc'
                                        : !playingPhase
                                            ? 'Đang chờ game...'
                                            : !effectivePlayerId
                                                ? 'Chọn player để chơi...'
                                                : isMyTurn
                                                    ? `NHẬP ${room?.codeLength ?? '?'} SỐ...`
                                                    : 'Chờ đối thủ...'
                                }
                                className="w-full rounded-sm border border-indigo-500/30 bg-[#030B1B] px-4 py-3 text-center font-mono text-xl font-bold tracking-[0.14em] text-cyan-300 placeholder-slate-700 outline-none transition-all focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-4 sm:text-3xl sm:tracking-[0.2em]"
                            />
                            <button
                                type="submit"
                                disabled={finishedPhase || !playingPhase || !effectivePlayerId || !isMyTurn || submittingGuess || guessValue.length !== (room?.codeLength ?? 0)}
                                className="inline-flex items-center justify-center gap-2 rounded-sm bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 text-xs font-bold tracking-[0.14em] text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 sm:px-8 sm:py-4 sm:text-sm sm:tracking-[0.2em]"
                            >
                                <Send className="h-5 w-5" />
                                {submittingGuess ? '...' : 'ĐOÁN'}
                            </button>
                        </form>
                        {loadingRoom ? <p className="mt-2 text-xs text-slate-400">Đang tải trạng thái...</p> : null}
                        {message ? <p className="mt-2 text-xs text-emerald-300">{message}</p> : null}
                        {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
                    </footer>
                ) : (
                    <footer className="border-t border-indigo-500/20 bg-[#09172E] p-3 sm:p-6">
                        {loadingRoom ? <p className="text-xs text-slate-400">Đang tải trạng thái...</p> : null}
                        {message ? <p className="text-xs text-emerald-300">{message}</p> : null}
                        {error ? <p className="text-xs text-rose-300">{error}</p> : null}
                    </footer>
                )}
            </div>
        </div>
    );
}

