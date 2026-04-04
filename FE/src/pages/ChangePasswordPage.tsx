import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth';
import HeaderNav from '../components/HeaderNav';
import GlassCard from '../components/GlassCard';
import PasswordInput from '../components/PasswordInput';
import { changePassword } from '../lib/api';

export default function ChangePasswordPage() {
    const nav = useNavigate();
    const { isAuthed, hydrated } = useAuth();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    if (!hydrated) {
        return null;
    }
    if (!isAuthed) {
        nav(`/auth?returnTo=${encodeURIComponent('/account/change-password')}`, { replace: true });
        return null;
    }

    return (
        <div className="min-h-screen bg-linear-to-b from-[#99F6E4] via-[#CFFAF3] to-white px-3 py-3 text-slate-800 sm:px-5">
            <HeaderNav />
            <div className="mx-auto flex max-w-5xl items-center justify-center">
                <GlassCard className="max-w-lg">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">NUMO / SECURITY</p>
                            <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-900">Đổi mật khẩu</h1>
                        </div>
                        <button onClick={() => nav('/')} className="text-xs text-slate-500 hover:text-slate-800">
                            ← Home
                        </button>
                    </div>

                    <div className="space-y-3 rounded-lg border border-slate-200/80 bg-white/70 p-4 text-sm text-slate-700">
                        {error ? <p className="text-rose-600">{error}</p> : null}
                        {success ? <p className="text-emerald-600">{success}</p> : null}
                        <PasswordInput value={oldPassword} onChange={setOldPassword} placeholder="Mật khẩu hiện tại" />
                        <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="Mật khẩu mới (≥ 6 ký tự)" />
                        <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Nhập lại mật khẩu mới" />
                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={() => nav('/account')}
                                className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-700"
                            >
                                Hủy
                            </button>
                            <button
                                disabled={
                                    loading ||
                                    newPassword.trim().length < 6 ||
                                    !oldPassword.trim() ||
                                    confirmPassword.trim() !== newPassword.trim()
                                }
                                onClick={() => void (async () => {
                                    setLoading(true);
                                    setError('');
                                    setSuccess('');
                                    try {
                                        if (confirmPassword.trim() !== newPassword.trim()) {
                                            throw new Error('Xác nhận mật khẩu không khớp');
                                        }
                                        await changePassword({ oldPassword: oldPassword.trim(), newPassword: newPassword.trim() });
                                        setSuccess('Đổi mật khẩu thành công');
                                        setOldPassword('');
                                        setNewPassword('');
                                        setConfirmPassword('');
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    } catch (e: any) {
                                        setError(e?.message || 'Đổi mật khẩu thất bại');
                                    } finally {
                                        setLoading(false);
                                    }
                                })()}
                                className="w-full rounded bg-linear-to-r from-teal-500 to-cyan-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            >
                                {loading ? '...' : 'Cập nhật'}
                            </button>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}

