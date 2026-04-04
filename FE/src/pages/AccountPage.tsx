/* eslint-disable no-unsafe-finally */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth';
import { usersMe } from '../lib/api';
import type { UserProfile } from '../types/user';
import FullScreenLoader from '../components/FullScreenLoader';

export default function AccountPage() {
    const nav = useNavigate();
    const { isAuthed, displayName, hydrated } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        if (!hydrated) return;
        if (!isAuthed) {
            nav(`/auth?returnTo=${encodeURIComponent('/account')}`, { replace: true });
        }
    }, [hydrated, isAuthed, nav]);

    useEffect(() => {
        let alive = true;

        const fetchProfile = async () => {
            if (!hydrated || !isAuthed) return;
            setLoading(true);
            setError('');
            try {
                const res = await usersMe();
                if (!alive) return;
                setProfile(res?.data?.user ?? null);
            } catch (e: unknown) {
                if (!alive) return;
                if (e instanceof Error) {
                    setError(e.message);
                } else {
                    setError('Không lấy được thông tin tài khoản');
                }
            } finally {
                if (!alive) return;
                setLoading(false);
            }
        };

        fetchProfile();
        return () => {
            alive = false;
        };
    }, [hydrated, isAuthed]);

    if (loading) {
        return <FullScreenLoader subtitle="Vui lòng đợi trong giây lát..." />;
    }

    return (
        <div className="min-h-screen bg-linear-to-b from-[#99F6E4] via-[#CFFAF3] to-white px-3 py-3 text-slate-800 sm:px-5 flex items-center justify-center">
            <div className="w-full max-w-lg rounded-2xl border border-teal-200/60 bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/75 p-5 shadow-[0_0_0_1px_rgba(13,148,136,0.18),0_10px_50px_rgba(2,132,199,0.10)]">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">NUMO / ACCOUNT</p>
                        <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-900">Thông tin tài khoản</h1>
                    </div>
                    <button onClick={() => nav('/')} className="text-xs text-slate-500 hover:text-slate-800">
                        ← Home
                    </button>
                </div>

                {error ? (
                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700">{error}</div>
                ) : null}

                <div className="mt-3 grid gap-3">
                    <div className="rounded-lg border border-slate-200/80 bg-white/70 p-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Display name</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">
                            {loading ? '...' : (profile?.username || displayName || '(unknown)')}
                        </p>
                    </div>
                    <div className="rounded-lg border border-slate-200/80 bg-white/70 p-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Email</p>
                        <p className="mt-2 text-sm text-slate-800">{loading ? '...' : (profile?.email || '(n/a)')}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-lg border border-slate-200/80 bg-white/70 p-4 text-center">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Thắng</p>
                            <p className="mt-1 text-xl font-bold text-emerald-600">{loading ? '...' : (profile?.winCount ?? 0)}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200/80 bg-white/70 p-4 text-center">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Thua</p>
                            <p className="mt-1 text-xl font-bold text-rose-500">{loading ? '...' : (profile?.lossCount ?? 0)}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200/80 bg-white/70 p-4 text-center">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Hòa</p>
                            <p className="mt-1 text-xl font-bold text-sky-600">{loading ? '...' : (profile?.drawCount ?? 0)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

