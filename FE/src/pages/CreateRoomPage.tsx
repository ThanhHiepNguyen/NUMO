import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../lib/api';
import { useAuth } from '../state/auth';

export default function CreateRoomPage() {
    const nav = useNavigate();
    const { isAuthed } = useAuth();

    const [codeLength, setCodeLength] = useState(4);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const canSubmit = !loading;

    useEffect(() => {
        if (!isAuthed) {
            nav(`/auth?returnTo=${encodeURIComponent('/create')}`, { replace: true });
        }
    }, [isAuthed, nav]);

    if (!isAuthed) return null;

    const submit = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await createRoom({ codeLength });
            const roomCode = res?.data?.room?.code;
            if (!roomCode) throw new Error('Tạo phòng thành công nhưng thiếu mã phòng');
            const playerId = res?.data?.hostPlayer?.id as string | undefined;
            const role = res?.data?.hostPlayer?.role as ('PLAYER_1' | 'PLAYER_2') | undefined;
            nav(`/room/${encodeURIComponent(roomCode)}`, {
                state: { playerId, role, nickname: 'host' },
            });
        } catch (e: any) {
            setError(e?.message || 'Có lỗi khi tạo phòng');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030B1B] px-3 py-3 text-slate-100 sm:px-5 flex items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border border-slate-800/70 bg-[#071329] p-5 shadow-[0_0_0_1px_rgba(99,102,241,0.16),0_0_40px_rgba(59,130,246,0.10)]">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-100">Tạo phòng</h1>
                    </div>
                    <button
                        onClick={() => nav('/')}
                        className="text-xs text-slate-400 hover:text-slate-200"
                    >
                        ← Home
                    </button>
                </div>

                <label className="block text-xs uppercase tracking-[0.14em] text-slate-500">Độ dài mật mã (3-6)</label>
                <input
                    type="number"
                    min={3}
                    max={6}
                    value={codeLength}
                    onChange={(e) =>
                        setCodeLength(Math.max(3, Math.min(6, Number(e.target.value) || 4)))
                    }
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-[#030B1B] px-3 py-2.5 text-sm outline-none focus:border-cyan-400"
                />

                {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}

                <div className="mt-4 flex gap-2">
                    <button
                        onClick={() => nav('/')}
                        className="w-full rounded-lg border border-slate-700 px-3 py-2.5 text-sm text-slate-300"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={() => void submit()}
                        disabled={!canSubmit}
                        className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        {loading ? '...' : 'Tạo phòng'}
                    </button>
                </div>
            </div>
        </div>
    );
}

