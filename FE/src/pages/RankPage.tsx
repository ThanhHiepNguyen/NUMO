import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRank } from '../lib/api';
import type { RankItem, RankResponse } from '../types/api';
import HeaderNav from '../components/HeaderNav';
import GlassCard from '../components/GlassCard';
import FullScreenLoader from '../components/FullScreenLoader';

async function fetchRank(limit = 20): Promise<{ items: RankItem[] }> {
    const res: RankResponse = await getRank(limit);
    return res.data;
}

export default function RankPage() {
    const nav = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [items, setItems] = useState<RankItem[]>([]);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                setError('');
                const data = await fetchRank(50);
                if (!alive) return;
                setItems(data.items || []);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                if (!alive) return;
                setError(e?.message || 'Không tải được bảng xếp hạng');
            } finally {
                // eslint-disable-next-line no-unsafe-finally
                if (!alive) return;
                setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    if (loading) {
        return <FullScreenLoader subtitle="Vui lòng đợi trong giây lát..." />;
    }

    return (
        <div className="min-h-screen bg-linear-to-b from-[#99F6E4] via-[#CFFAF3] to-white px-3 py-3 text-slate-800 sm:px-5">
            <HeaderNav />
            <div className="mx-auto flex max-w-5xl items-center justify-center">
                <GlassCard className="max-w-3xl">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">NUMO / RANK</p>
                            <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-900">Xếp hạng theo số trận thắng</h1>
                        </div>
                        <button onClick={() => nav('/')} className="text-xs text-slate-500 hover:text-slate-800">
                            ← Home
                        </button>
                    </div>

                    {error ? <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700">{error}</div> : null}

                    <div className="rounded-lg border border-slate-200/80 bg-white/70 p-2 text-sm text-slate-700">
                        {loading ? 'Đang tải...' : (
                            <ul className="divide-y divide-slate-200">
                                {items.length === 0 ? (
                                    <li className="p-3 text-slate-600">Chưa có dữ liệu.</li>
                                ) : items.map((it) => (
                                    <li key={it.userId} className="flex items-center justify-between p-3">
                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-bold text-slate-700">
                                                {it.rank}
                                            </span>
                                            <span className="font-semibold text-slate-900">{it.username}</span>
                                        </div>
                                        <div className="text-teal-700 font-bold">{it.wins} thắng</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}

