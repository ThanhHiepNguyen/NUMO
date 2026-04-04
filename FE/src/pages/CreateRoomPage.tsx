import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../lib/api';
import { useAuth } from '../state/auth';

export default function CreateRoomPage() {
    const nav = useNavigate();
    const { isAuthed, hydrated } = useAuth();

    const [codeLength, setCodeLength] = useState(4);
    const [maxRounds, setMaxRounds] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const canSubmit = !loading;

    useEffect(() => {
        if (!hydrated) return;
        if (!isAuthed) {
            nav(`/auth?returnTo=${encodeURIComponent('/create')}`, { replace: true });
        }
    }, [hydrated, isAuthed, nav]);

    if (!hydrated) return null;
    if (!isAuthed) return null;

    const submit = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await createRoom({ codeLength, maxRounds });
            const roomCode = res?.data?.room?.code;
            if (!roomCode) throw new Error('Tạo phòng thành công nhưng thiếu mã phòng');
            const playerId = res?.data?.hostPlayer?.id as string | undefined;
            const role = res?.data?.hostPlayer?.role as ('PLAYER_1' | 'PLAYER_2') | undefined;
            nav(`/room/${encodeURIComponent(roomCode)}`, {
                state: { playerId, role, nickname: 'host' },
            });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            setError(e?.message || 'Có lỗi khi tạo phòng');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-b from-[#99F6E4] via-[#CFFAF3] to-white px-3 py-3 text-slate-800 sm:px-5 flex items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border border-teal-200/60 bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/75 p-5 shadow-[0_0_0_1px_rgba(13,148,136,0.18),0_10px_50px_rgba(2,132,199,0.10)]">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-900">Tạo phòng</h1>
                    </div>
                    <button
                        onClick={() => nav('/')}
                        className="text-xs text-slate-500 hover:text-slate-800"
                    >
                        ← Home
                    </button>
                </div>

                <label className="block text-xs uppercase tracking-[0.14em] text-slate-600">Độ dài mật mã (3-6)</label>
                <input
                    type="number"
                    min={3}
                    max={6}
                    value={codeLength}
                    onChange={(e) =>
                        setCodeLength(Math.max(3, Math.min(6, Number(e.target.value) || 4)))
                    }
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-400"
                />

                <label className="mt-5 block text-xs uppercase tracking-[0.14em] text-slate-600">
                    Tối đa lượt chơi (1-20)
                </label>
                <input
                    type="number"
                    min={1}
                    max={20}
                    value={maxRounds}
                    onChange={(e) =>
                        setMaxRounds(Math.max(1, Math.min(20, Number(e.target.value) || 10)))
                    }
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-400"
                />

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
                        {loading ? '...' : 'Tạo phòng'}
                    </button>
                </div>
            </div>
        </div>
    );
}

