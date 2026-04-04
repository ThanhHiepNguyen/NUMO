import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authLogin, authRegister, authResendOtp, authVerifyOtp } from '../lib/api';
import { useAuth } from '../state/auth';
import HeaderNav from '../components/HeaderNav';
import GlassCard from '../components/GlassCard';
import PasswordInput from '../components/PasswordInput';

type AuthMode = 'login' | 'register' | 'otp';

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
    const [otpCode, setOtpCode] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    const canSubmit =
        !loading &&
        ((mode === 'login' && Boolean(email.trim()) && Boolean(password.trim())) ||
            (mode === 'register' && Boolean(email.trim()) && Boolean(password.trim()) && Boolean(username.trim())) ||
            (mode === 'otp' && Boolean(email.trim()) && otpCode.trim().length === 6));

    const submit = async () => {
        setLoading(true);
        setError('');
        try {
            if (mode === 'login') {
                await authLogin({ email: email.trim(), password });
                setAuthed({
                    isAuthed: true,
                    displayName: email.split('@')[0] || '',
                    hydrated: true,
                });
                nav(returnTo);
            } else if (mode === 'register') {
                await authRegister({ email: email.trim(), password, username: username.trim() });
                setMode('otp');
            } else if (mode === 'otp') {
                await authVerifyOtp({ email: email.trim(), code: otpCode.trim() });
                setAuthed({
                    isAuthed: true,
                    displayName: (username.trim() || email.split('@')[0] || ''),
                    hydrated: true,
                });
                nav(returnTo);
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            setError(e?.message || 'Lỗi xác thực');
        } finally {
            setLoading(false);
        }
    };

    const resend = async () => {
        if (resendCooldown > 0) return;
        setError('');
        try {
            await authResendOtp({ email: email.trim() });
            setResendCooldown(30);
            const tick = setInterval(() => {
                setResendCooldown((t) => {
                    if (t <= 1) {
                        clearInterval(tick);
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            setError(e?.message || 'Không thể gửi lại OTP');
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-b from-[#99F6E4] via-[#CFFAF3] to-white px-3 py-3 text-slate-800 sm:px-5">
            <HeaderNav />
            <div className="mx-auto flex max-w-5xl items-center justify-center">
                <GlassCard className="max-w-md">
                    <div className="mb-4 flex items-center justify-between">
                        <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-teal-700">
                            {mode === 'login' ? 'Đăng nhập' : mode === 'register' ? 'Đăng ký' : 'Nhập OTP'}
                        </h1>
                        <button
                            onClick={() => nav('/')}
                            className="text-xs text-slate-500 hover:text-slate-800"
                        >
                            ← Home
                        </button>
                    </div>

                    <div className="mb-3 flex gap-2">
                        <button
                            onClick={() => setMode('login')}
                            className={`w-full rounded px-3 py-2 text-sm ${mode === 'login'
                                ? 'bg-linear-to-r from-teal-500 to-cyan-500 text-white'
                                : 'border border-slate-300 text-slate-700'
                                }`}
                        >
                            Đăng nhập
                        </button>
                        <button
                            onClick={() => setMode('register')}
                            className={`w-full rounded px-3 py-2 text-sm ${mode === 'register'
                                ? 'bg-linear-to-r from-teal-500 to-cyan-500 text-white'
                                : 'border border-slate-300 text-slate-700'
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
                            className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400"
                            disabled={mode === 'otp'}
                        />
                        {mode !== 'otp' ? (
                            <>
                                <PasswordInput value={password} onChange={setPassword} placeholder="Password" />
                                {mode === 'register' ? (
                                    <input
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Username"
                                        className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400"
                                    />
                                ) : null}
                            </>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    placeholder="Mã OTP (6 số)"
                                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400"
                                    maxLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => void resend()}
                                    disabled={resendCooldown > 0}
                                    className="whitespace-nowrap rounded border border-slate-300 px-3 py-2 text-xs text-slate-700 disabled:opacity-50"
                                >
                                    {resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : 'Gửi lại'}
                                </button>
                            </div>
                        )}
                    </div>

                    {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}

                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={() => nav('/')}
                            className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-700"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={() => void submit()}
                            disabled={!canSubmit}
                            className="w-full rounded bg-linear-to-r from-teal-500 to-cyan-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            {loading ? '...' : 'Xác nhận'}
                        </button>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}

