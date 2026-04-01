import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authLogin, authRegister } from '../lib/api';
import { useAuth } from '../state/auth';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
    const nav = useNavigate();
    const [sp] = useSearchParams();
    const returnTo = sp.get('returnTo') || '/';

    const { setAuthed } = useAuth();

    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const canSubmit =
        !loading &&
        Boolean(email.trim()) &&
        Boolean(password.trim()) &&
        (mode !== 'register' || Boolean(username.trim()));

    const submit = async () => {
        setLoading(true);
        setError('');
        try {
            if (mode === 'login') {
                await authLogin({ email: email.trim(), password });
                setAuthed({
                    isAuthed: true,
                    displayName: email.split('@')[0] || '',
                });
            } else {
                await authRegister({ email: email.trim(), password, username: username.trim() });
                setAuthed({
                    isAuthed: true,
                    displayName: username.trim(),
                });
            }
            nav(returnTo);
        } catch (e: any) {
            setError(e?.message || 'Lỗi xác thực');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030B1B] px-3 py-3 text-slate-100 sm:px-5 flex items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border border-indigo-500/50 bg-[#071329] p-5 shadow-[0_0_0_1px_rgba(99,102,241,0.3),0_0_40px_rgba(59,130,246,0.12)]">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
                        {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                    </h1>
                    <button
                        onClick={() => nav('/')}
                        className="text-xs text-slate-400 hover:text-slate-200"
                    >
                        ← Home
                    </button>
                </div>

                <div className="mb-3 flex gap-2">
                    <button
                        onClick={() => setMode('login')}
                        className={`w-full rounded px-3 py-2 text-sm ${mode === 'login'
                            ? 'bg-indigo-600 text-white'
                            : 'border border-slate-700 text-slate-300'
                            }`}
                    >
                        Đăng nhập
                    </button>
                    <button
                        onClick={() => setMode('register')}
                        className={`w-full rounded px-3 py-2 text-sm ${mode === 'register'
                            ? 'bg-indigo-600 text-white'
                            : 'border border-slate-700 text-slate-300'
                            }`}
                    >
                        Đăng ký
                    </button>
                </div>

                <div className="space-y-2">
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full rounded border border-slate-700 bg-[#030B1B] px-3 py-2 text-sm outline-none focus:border-cyan-400"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full rounded border border-slate-700 bg-[#030B1B] px-3 py-2 text-sm outline-none focus:border-cyan-400"
                    />
                    {mode === 'register' ? (
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            className="w-full rounded border border-slate-700 bg-[#030B1B] px-3 py-2 text-sm outline-none focus:border-cyan-400"
                        />
                    ) : null}
                </div>

                {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}

                <div className="mt-4 flex gap-2">
                    <button
                        onClick={() => nav('/')}
                        className="w-full rounded border border-slate-700 px-3 py-2 text-sm text-slate-300"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={() => void submit()}
                        disabled={!canSubmit}
                        className="w-full rounded bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        {loading ? '...' : 'Xác nhận'}
                    </button>
                </div>
            </div>
        </div>
    );
}

