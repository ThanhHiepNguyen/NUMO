import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth';

export default function AccountPage() {
    const nav = useNavigate();
    const { isAuthed, displayName } = useAuth();

    if (!isAuthed) {
        nav(`/auth?returnTo=${encodeURIComponent('/account')}`, { replace: true });
        return null;
    }

    return (
        <div className="min-h-screen bg-[#030B1B] px-3 py-3 text-slate-100 sm:px-5 flex items-center justify-center">
            <div className="w-full max-w-lg rounded-2xl border border-slate-800/70 bg-[#071329] p-5 shadow-[0_0_0_1px_rgba(99,102,241,0.16),0_0_40px_rgba(59,130,246,0.10)]">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">NUMO / ACCOUNT</p>
                        <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-100">Thông tin tài khoản</h1>
                    </div>
                    <button onClick={() => nav('/')} className="text-xs text-slate-400 hover:text-slate-200">
                        ← Home
                    </button>
                </div>

                <div className="rounded-lg border border-slate-800/70 bg-slate-900/20 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Display name</p>
                    <p className="mt-2 text-lg font-semibold text-slate-100">{displayName || '(unknown)'}</p>
                    <p className="mt-2 text-xs text-slate-500">
                        (Tạm thời FE chỉ hiển thị tên. Nếu cần full info, mình sẽ map thêm từ `GET /auth/me`.)
                    </p>
                </div>
            </div>
        </div>
    );
}

