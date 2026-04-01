import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth';

export default function HistoryPage() {
  const nav = useNavigate();
  const { isAuthed } = useAuth();

  if (!isAuthed) {
    nav(`/auth?returnTo=${encodeURIComponent('/history')}`, { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-[#030B1B] px-3 py-3 text-slate-100 sm:px-5 flex items-center justify-center">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-800/70 bg-[#071329] p-5 shadow-[0_0_0_1px_rgba(99,102,241,0.16),0_0_40px_rgba(59,130,246,0.10)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">NUMO / HISTORY</p>
            <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-100">Lịch sử</h1>
          </div>
          <button onClick={() => nav('/')} className="text-xs text-slate-400 hover:text-slate-200">
            ← Home
          </button>
        </div>

        <div className="rounded-lg border border-slate-800/70 bg-slate-900/20 p-4 text-sm text-slate-300">
          Placeholder: lịch sử trận/guess. (Cần API BE + schema lưu history để show ở đây.)
        </div>
      </div>
    </div>
  );
}

