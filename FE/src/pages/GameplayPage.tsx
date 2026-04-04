import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../state/auth';
import ResultModal from '../components/gameplay/ResultModal';
import TurnHeader from '../components/gameplay/TurnHeader';
import MyBoard from '../components/gameplay/MyBoard';
import OpponentBoard from '../components/gameplay/OpponentBoard';
import GuessForm from '../components/gameplay/GuessForm';
import PlayerSelector from '../components/gameplay/PlayerSelector';
import WaitingRoomCard from '../components/gameplay/WaitingRoomCard';
import type { PlayerRole } from '../types/gameplay';

import { useTurnTimer } from '../hooks/useTurnTimer';
import { useRoomState } from '../hooks/useRoomState';
import { useRealtime } from '../hooks/useRealtime';
import { useSessionCache } from '../hooks/useSessionCache';
import { useRoomActions } from '../hooks/useRoomActions';

type RouteState = {
    playerId?: string;
    role?: PlayerRole;
    nickname?: string;
};

const POLL_INTERVAL_MS = 8000;

export default function GameplayPage() {
    const nav = useNavigate();
    const location = useLocation();
    const { code } = useParams<{ code: string }>();
    const { displayName } = useAuth();

    const roomCode = code || '------';
    const routeState = (location.state ?? {}) as RouteState;

    const { room, players, guessLogs, setGuessLogs, loadingRoom, loadedOnce, /* error: loadError, setError: setLoadError, */ loadState } = useRoomState();
    const [secretValue, setSecretValue] = useState('');
    const [submittingSecret, setSubmittingSecret] = useState(false);
    const [submittingGuess, setSubmittingGuess] = useState(false);
    const [submittingLeave, setSubmittingLeave] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [lastSubmittedGuess, setLastSubmittedGuess] = useState('');
    const [mySecretPreview, setMySecretPreview] = useState('');
    const { /* remainingSeconds, */ timerText } = useTurnTimer(!!(room?.status === 'PLAYING'), !!room?.currentTurn, room?.turnStartedAt ? new Date(room.turnStartedAt) : null);

    const [guessValue, setGuessValue] = useState('');
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>(() => routeState.playerId ?? '');

    // Kick off initial load + polling

    useEffect(() => {
        if (!code) return;
        void loadState(code);
        let id: ReturnType<typeof window.setInterval> | null = window.setInterval(() => {
            if (code) void loadState(code);
        }, POLL_INTERVAL_MS);

        const onVis = () => {

            if (document.visibilityState === 'hidden') {
                if (id) window.clearInterval(id);
                id = null;
                return;
            }
            if (!id) {
                if (code) void loadState(code);
                id = window.setInterval(() => {
                    if (code) void loadState(code);
                }, POLL_INTERVAL_MS);
            }
        };

        document.addEventListener('visibilitychange', onVis);
        return () => {
            if (id) window.clearInterval(id);
            document.removeEventListener('visibilitychange', onVis);
        };
    }, [code, loadedOnce, loadState]);

    useRealtime(code, () => { if (code) void loadState(code); });

    // selectedPlayerId initializes from routeState; user can change via PlayerSelector afterwards

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
    // const turnStartedAt = room?.turnStartedAt ? new Date(room.turnStartedAt) : null;

    const winnerRole = room?.winnerRole as PlayerRole | null | undefined;
    const didIWin = !!myRole && winnerRole === myRole;
    const isTie = !winnerRole;

    useSessionCache(sessionCacheKey, { mySecretPreview, setMySecretPreview, lastSubmittedGuess, setLastSubmittedGuess, guessLogs, setGuessLogs });

    useEffect(() => {
        if (!finishedPhase || !sessionCacheKey) return;
        window.sessionStorage.removeItem(sessionCacheKey);
    }, [finishedPhase, sessionCacheKey]);

    const displayTimerText = isMyTurn ? timerText : '--:--';

    const { submitSecret, onStart, submitGuess, onLeaveRoom, copyRoomCode } = useRoomActions({
        code,
        effectivePlayerId,
        roomStatus: room?.status,
        currentTurn: room?.currentTurn ?? null,
        codeLength: room?.codeLength,
        isMyTurn,
        loadState: (c) => loadState(c),
        setError,
        setMessage,
        setSubmittingSecret,
        setSubmittingGuess,
        setSubmittingLeave,
        setMySecretPreview,
        setSecretValue,
    });

    const onSubmitSecret = () => void submitSecret(secretValue);

    const playerSelectorNode = (
        <PlayerSelector
            players={players}
            effectivePlayerId={effectivePlayerId}
            onSelect={(id) => setSelectedPlayerId(id)}
        />
    );

    // onLeaveRoom handled by useRoomActions

    return (
        <div className="min-h-screen bg-linear-to-b from-[#99F6E4] via-[#CFFAF3] to-white px-2 py-2 text-slate-800 sm:px-5 sm:py-3 flex items-center justify-center">
            <ResultModal open={!!finishedPhase} isTie={!!isTie} didIWin={!!didIWin} onHome={() => nav('/')} />
            <div className="w-full max-w-5xl rounded-2xl border border-teal-200/60 bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/75 shadow-[0_0_0_1px_rgba(13,148,136,0.18),0_10px_50px_rgba(2,132,199,0.10)] flex flex-col h-[92vh] sm:h-[85vh] overflow-hidden">
                <TurnHeader
                    turnStatusText={turnStatusText}
                    roomCode={roomCode}
                    displayName={displayName}
                    canStart={!!canStart}
                    onStart={() => void onStart()}
                    displayTimerText={displayTimerText}
                    onLeaveRoom={() => void onLeaveRoom()}
                    submittingLeave={submittingLeave}
                />

                <main className="flex-1 bg-white/50 overflow-y-auto">
                    {waitingPhase ? (
                        <div className="p-4 sm:p-6">
                            <WaitingRoomCard
                                roomCode={roomCode}
                                playerOneName={playerOneName}
                                playerTwoName={playerTwoName}
                                onCopyRoomCode={() => void copyRoomCode()}
                            />
                            <div className="p-4"></div>
                            <PlayerSelector
                                players={players}
                                effectivePlayerId={effectivePlayerId}
                                onSelect={(id) => setSelectedPlayerId(id)}
                                className="mt-0 rounded-md border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200"
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/50 md:overflow-hidden">
                            <MyBoard
                                secretPhase={!!secretPhase}
                                codeLength={room?.codeLength}
                                secretValue={secretValue}
                                onSecretChange={(v) => setSecretValue(v)}
                                onSubmitSecret={onSubmitSecret}
                                submittingSecret={submittingSecret}
                                effectivePlayerId={effectivePlayerId}
                                mySecretPreview={mySecretPreview}
                                myGuessLogs={myGuessLogs}
                                playerSelector={playerSelectorNode}
                            />
                            <OpponentBoard
                                opponentGuessLogs={opponentGuessLogs}
                                playerNameById={playerNameById}
                                playerRoleById={playerRoleById}
                            />
                        </div>
                    )}
                </main>

                <footer className="border-t border-teal-200/60 bg-white/60 p-3 sm:p-6">
                    <GuessForm
                        value={guessValue}
                        onChange={setGuessValue}
                        onSubmit={() => void submitGuess(guessValue.trim())}
                        inputDisabled={!!(finishedPhase || !playingPhase || !effectivePlayerId || !isMyTurn || submittingGuess)}
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
                        buttonDisabled={!!(finishedPhase || !playingPhase || !effectivePlayerId || !isMyTurn || submittingGuess || guessValue.length !== (room?.codeLength ?? 0))}
                        submitting={!!submittingGuess}
                    />
                    {loadingRoom ? <p className="mt-2 text-xs text-slate-400">Đang tải trạng thái...</p> : null}
                    {message ? <p className="mt-2 text-xs text-emerald-300">{message}</p> : null}
                    {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
                </footer>
            </div>
        </div>
    );
}

