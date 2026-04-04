import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinRoom } from '../lib/api';
import { useAuth } from '../state/auth';

function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error && error.message) return error.message;
    return fallback;
}

export default function JoinRoomPage() {
    const nav = useNavigate();
    const { displayName } = useAuth();

    const [roomCode, setRoomCode] = useState('');
    const [nickname, setNickname] = useState(displayName);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');

    const canSubmit =
        Boolean(roomCode.trim()) && Boolean(nickname.trim()) && !loading;

    const submit = async () => {
        setLoading(true);
        setError('');
        setStatus('');
        try {
            const code = roomCode.trim();
            const nick = nickname.trim();

            if (!/^\d{6}$/.test(code)) {
                throw new Error('Mã phòng phải gồm đúng 6 chữ số');
            }
            if (nick.length < 2) {
                throw new Error('Tên hiển thị phải có ít nhất 2 ký tự');
            }
            if (nick.length > 20) {
                throw new Error('Tên hiển thị tối đa 20 ký tự');
            }

            const res = await joinRoom(code, { nickname: nick });
            const joined = res?.data?.room?.code ?? code;
            const playerId = res?.data?.player?.id as string | undefined;
            const role = res?.data?.player?.role as ('PLAYER_1' | 'PLAYER_2') | undefined;
            setStatus(`Vào phòng thành công: ${joined}`);
            nav(`/room/${encodeURIComponent(joined)}`, {
                state: { playerId, role, nickname: nick },
            });
        } catch (e: unknown) {
            setError(getErrorMessage(e, 'Có lỗi khi vào phòng'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-b from-[#99F6E4] via-[#CFFAF3] to-white px-3 py-3 text-slate-800 sm:px-5 flex items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border border-teal-200/60 bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/75 p-5 shadow-[0_0_0_1px_rgba(13,148,136,0.18),0_10px_50px_rgba(2,132,199,0.10)]">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">NUMO / ROOM</p>
                        <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-900">Vào phòng</h1>
                    </div>
                    <button
                        onClick={() => nav('/')}
                        className="text-xs text-slate-500 hover:text-slate-800"
                    >
                        ← Home
                    </button>
                </div>

                <div className="space-y-3">
                    <label className="block text-xs uppercase tracking-[0.14em] text-slate-600">Mã phòng</label>
                    <input
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        placeholder="VD: 849773"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-400"
                    />

                    <label className="block text-xs uppercase tracking-[0.14em] text-slate-600">Tên hiển thị</label>
                    <input
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Nickname"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-400"
                    />
                </div>

                {status ? <p className="mt-3 text-xs text-emerald-600">{status}</p> : null}
                {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}

                <div className="mt-4 flex gap-2">
                    <button
                        onClick={() => nav('/')}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-700"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={() => void submit()}
                        disabled={!canSubmit}
                        className="w-full rounded-lg bg-linear-to-r from-teal-500 to-cyan-500 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        {loading ? '...' : 'Vào phòng'}
                    </button>
                </div>
            </div>
        </div>
    );
}

