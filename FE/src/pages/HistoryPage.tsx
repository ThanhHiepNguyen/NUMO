import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth';
import { getHistory } from '../lib/api';
import type { HistoryItem, HistoryResponse } from '../types/api';
import HeaderNav from '../components/HeaderNav';
import GlassCard from '../components/GlassCard';
import FullScreenLoader from '../components/FullScreenLoader';

export default function HistoryPage() {
  const nav = useNavigate();
  const { isAuthed, hydrated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    let alive = true;
    if (!hydrated || !isAuthed) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const res: HistoryResponse = await getHistory(20);
        if (alive) {
          setItems(res?.data?.items ?? []);
        }
      } catch (e: unknown) {
        if (alive) {
          if (e instanceof Error) {
            setError(e.message);
          } else {
            setError('Không tải được lịch sử');
          }
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    void fetchHistory();
    return () => { alive = false; };
  }, [hydrated, isAuthed]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthed) {
      nav(`/auth?returnTo=${encodeURIComponent('/history')}`, { replace: true });
    }
  }, [hydrated, isAuthed, nav]);

  function getEndReasonLabel(reason: string | null): string {
    switch (reason) {
      case 'FULL_CODE_WIN':
        return 'Đoán đúng toàn bộ';
      case 'MISS_LIMIT':
        return 'Quá số lần bỏ lượt';
      case 'MAX_ROUNDS_TIE':
        return 'Hết lượt, xử hòa';
      case 'ABANDONED':
        return 'Bỏ cuộc';
      default:
        return reason || 'N/A';
    }
  }

  if (!hydrated) return null;
  if (!isAuthed) return null;
  if (loading) return <FullScreenLoader subtitle="Vui lòng đợi trong giây lát..." />;

  return (
    <div className="min-h-screen bg-linear-to-b from-[#99F6E4] via-[#CFFAF3] to-white px-3 py-3 text-slate-800 sm:px-5">
      <HeaderNav />
      <div className="mx-auto flex max-w-5xl items-center justify-center">
        <GlassCard className="max-w-3xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">NUMO / HISTORY</p>
              <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-900">Lịch sử</h1>
            </div>
            <button onClick={() => nav('/')} className="text-xs text-slate-500 hover:text-slate-800">
              ← Home
            </button>
          </div>

          {error ? <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700">{error}</div> : null}

          <div className="rounded-lg border border-slate-200/80 bg-white/70 p-4 text-sm text-slate-700">
            {loading ? 'Đang tải...' : (
              <div className="space-y-3">
                {items.length === 0 ? (
                  <p className="text-slate-600">Chưa có trận nào.</p>
                ) : items.map((r, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200/80 bg-white/80 p-4 transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">Room #{r.code}</p>
                      <p className="text-xs text-slate-500">{r.finishedAt ? new Date(r.finishedAt).toLocaleString() : ''}</p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700">
                        Kết thúc:
                        <strong className="ml-1">{getEndReasonLabel(r.endReason)}</strong>
                      </span>
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700">
                        Vòng: <strong className="ml-1">{r.currentRound}</strong>
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] border ${r.winnerRole ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'
                        }`}>
                        {r.winnerRole ? `Thắng: ${r.winnerRole}` : 'Hòa'}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-md border border-slate-200 bg-white/70 p-3">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Người chơi</p>
                        <ul className="mt-2 list-disc pl-5 text-xs text-slate-800">
                          {r.players.map((p, i) => (
                            <li key={i}>{p.role}: {p.nickname}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white/70 p-3 text-xs text-slate-700">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Ghi chú</p>
                        <p className="mt-2">Kết quả được chốt khi một bên đoán đúng toàn bộ hoặc hết round tối đa.</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

