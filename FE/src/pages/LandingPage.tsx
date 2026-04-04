import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Bell, ChevronDown, Grid3x3, History, KeyRound, LockKeyhole, LogIn, ShieldCheck, UserCircle2 } from 'lucide-react';
import { authLogout } from '../lib/api';
import { useAuth } from '../state/auth';


export default function LandingPage() {
    const nav = useNavigate();
    const { isAuthed, displayName, clear } = useAuth();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [lang, setLang] = useState<'en' | 'vi'>('vi');

    const t = {
        en: {
            badge: 'INTELLECT_BATTLE',
            navBattle: 'BATTLE',
            navRank: 'RANK',
            heroTitleA: 'NUMO',
            heroTitleB: 'DUEL',
            heroDesc:
                'Decipher the hidden sequence. Outsmart your rival in the ultimate tactical numerical confrontation.',
            createRoom: 'CREATE ROOM',
            enterRoom: 'ENTER ROOM',
            globalWinRate: 'Global Win Rate',
            activePlayers: 'Active Players',
            howToPlay: 'How To Play',
            scoringSystem: 'Scoring System',
            bulls: 'Bulls',
            cows: 'Cows',
            bullsDesc: 'Correct digit, correct position',
            cowsDesc: 'Correct digit, wrong position',
            tacticalNote: 'Tactical Note',
            tacticalDesc:
                'Duplicate digits are prohibited in advanced play. Test everything with precise elimination logic.',
            step1: 'GUESS 3-6 NUMBERS',
            step1Desc:
                "Submit a unique sequence of 3 to 6 digits (based on room difficulty) to probe your opponent's hidden code.",
            step2: 'GET FEEDBACK',
            step2Desc:
                'Analyze the Bulls and Cows returned to determine proximity to the target.',
            step3: 'DECIPHER FIRST',
            step3Desc:
                'The first operative to crack the exact sequence wins the duel.',
        },
        vi: {
            badge: 'TRẬN ĐẠI CHIẾN TRÍ TUỆ',
            navBattle: 'ĐẤU TRẬN',
            navRank: 'XẾP HẠNG',

            heroTitleA: 'NUMO',
            heroTitleB: 'SO TÀI',
            heroDesc:
                'Giải mã chuỗi bí ẩn. Đánh bại đối thủ trong trận đấu số học đầy chiến thuật.',
            createRoom: 'TẠO PHÒNG',
            enterRoom: 'VÀO PHÒNG',
            globalWinRate: 'TỶ LỆ THẮNG TOÀN CỤC',
            activePlayers: 'NGƯỜI CHƠI ĐANG HOẠT ĐỘNG',
            howToPlay: 'CÁCH CHƠI',
            scoringSystem: 'HỆ THỐNG CHẤM ĐIỂM',
            bulls: 'Bulls',
            cows: 'Cows',
            bullsDesc: 'Số đúng và đúng vị trí',
            cowsDesc: 'Số đúng nhưng sai vị trí',
            tacticalNote: 'GHI CHÚ CHIẾN THUẬT',
            tacticalDesc:
                'Trong chế độ nâng cao, không được trùng số. Hãy loại trừ thật chính xác.',
            step1: 'ĐOÁN 3-6 CHỮ SỐ',
            step1Desc:
                'Nhập từ 3 đến 6 chữ số (tùy độ khó phòng) không trùng lặp để thăm dò mật mã của đối thủ.',
            step2: 'PHÂN TÍCH PHẢN HỒI',
            step2Desc:
                'Dùng Bulls và Cows trả về để xác định độ gần với đáp án.',
            step3: 'PHÁ MÃ SỚM NHẤT',
            step3Desc:
                'Người giải mã chính xác toàn bộ vị trí các chữ số đầu tiên sẽ chiến thắng.',
        },
    }[lang];

    const howToPlay = [
        { step: '01', title: t.step1, desc: t.step1Desc, icon: Grid3x3 },
        { step: '02', title: t.step2, desc: t.step2Desc, icon: BarChart3 },
        { step: '03', title: t.step3, desc: t.step3Desc, icon: LockKeyhole },
    ];

    useEffect(() => {
        const onDown = (e: MouseEvent) => {
            if (!userMenuOpen) return;
            const target = e.target as HTMLElement | null;
            if (!target) return;
            if (!target.closest('[data-user-menu]')) setUserMenuOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (!userMenuOpen) return;
            if (e.key === 'Escape') setUserMenuOpen(false);
        };
        window.addEventListener('mousedown', onDown);
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('mousedown', onDown);
            window.removeEventListener('keydown', onKey);
        };
    }, [userMenuOpen]);

    return (
        <div className="min-h-screen bg-linear-to-b from-[#99F6E4] via-[#CFFAF3] to-white px-3 py-3 text-slate-800 sm:px-5">
            <div className="mx-auto min-h-[95vh] w-full max-w-5xl rounded-2xl border border-teal-200/60 bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/75 shadow-[0_0_0_1px_rgba(13,148,136,0.18),0_10px_50px_rgba(2,132,199,0.10)]">
                <header className="flex items-center justify-between border-b border-teal-200/60 px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    <p className="font-semibold text-slate-700">{t.badge}</p>
                    <div className="hidden items-center gap-6 md:flex">
                        <button className="text-teal-700">{t.navBattle}</button>
                        <button className="hover:text-slate-700" onClick={() => nav('/rank')}>{t.navRank}</button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setLang('en')}
                            className={`rounded px-1.5 py-0.5 normal-case ${lang === 'en' ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            EN
                        </button>
                        <button
                            onClick={() => setLang('vi')}
                            className={`rounded px-1.5 py-0.5 normal-case ${lang === 'vi' ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            VI
                        </button>
                        <Bell className="h-4 w-4" />

                        <div data-user-menu className="relative">
                            <button
                                onClick={() => {
                                    if (!isAuthed) {
                                        nav('/auth');
                                        return;
                                    }
                                    setUserMenuOpen((v) => !v);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white/70 px-2 py-1 text-[10px] font-bold tracking-[0.16em] text-slate-700 hover:border-slate-400 hover:bg-white"
                                title={isAuthed ? (displayName || 'Account') : 'Login'}
                            >
                                <UserCircle2 className={`h-4 w-4 ${isAuthed ? 'text-teal-600' : 'text-slate-500'}`} />
                                <ChevronDown className={`h-3.5 w-3.5 text-slate-600 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {userMenuOpen ? (
                                <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 overflow-hidden rounded-xl border border-slate-800/80 bg-[#061126]/95 shadow-[0_0_0_1px_rgba(15,23,42,0.4),0_0_50px_rgba(59,130,246,0.12)] backdrop-blur">
                                    <div className="border-b border-slate-800/80 px-3 py-3">
                                        <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                                            Tài khoản
                                        </p>
                                        <p className="mt-1 truncate text-sm font-semibold text-slate-100">
                                            {displayName || 'User'}
                                        </p>
                                    </div>

                                    <div className="p-1">
                                        <button
                                            onClick={() => { setUserMenuOpen(false); nav('/account'); }}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700/20"
                                        >
                                            <UserCircle2 className="h-4 w-4 text-slate-300" />
                                            Thông tin tài khoản
                                        </button>

                                        <button
                                            onClick={() => { setUserMenuOpen(false); nav('/rank'); }}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700/20"
                                        >
                                            <ShieldCheck className="h-4 w-4 text-slate-300" />
                                            Xếp hạng
                                        </button>

                                        <button
                                            onClick={() => { setUserMenuOpen(false); nav('/account/change-password'); }}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700/20"
                                        >
                                            <KeyRound className="h-4 w-4 text-slate-300" />
                                            Đổi mật khẩu
                                        </button>

                                        <button
                                            onClick={() => { setUserMenuOpen(false); nav('/history'); }}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700/20"
                                        >
                                            <History className="h-4 w-4 text-slate-300" />
                                            Lịch sử
                                        </button>

                                        <div className="my-1 h-px bg-slate-800/80" />

                                        <button
                                            onClick={() => void (async () => {
                                                setUserMenuOpen(false);
                                                try {
                                                    await authLogout();
                                                } finally {
                                                    clear();
                                                }
                                            })()}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-200 hover:bg-rose-500/10"
                                        >
                                            <LockKeyhole className="h-4 w-4 text-rose-300" />
                                            Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </header>

                <main className="px-5 pb-6 pt-10 md:px-12">
                    <section className="text-center">
                        <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
                            <span className="text-slate-900">{t.heroTitleA} </span>
                            <span className="bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                {t.heroTitleB}
                            </span>
                        </h1>
                        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600">
                            {t.heroDesc}
                        </p>
                        <div className="mx-auto mt-8 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
                            <button
                                onClick={() => nav('/create')}
                                className="inline-flex items-center justify-center gap-2 rounded-sm border border-teal-200/60 bg-linear-to-r from-teal-500 to-cyan-500 px-5 py-3 text-xs font-bold tracking-[0.18em] text-white transition-all hover:brightness-110 active:scale-[0.98]"
                            >
                                <ShieldCheck className="h-4 w-4" />
                                {t.createRoom}
                            </button>
                            <button
                                onClick={() => nav('/join')}
                                className="inline-flex items-center justify-center gap-2 rounded-sm border border-slate-300 bg-transparent px-5 py-3 text-xs font-bold tracking-[0.18em] text-slate-700 transition-all hover:border-slate-400 hover:text-slate-900 active:scale-[0.98]"
                            >
                                <LogIn className="h-4 w-4" />
                                {t.enterRoom}
                            </button>
                        </div>
                    </section>

                    <section className="mt-10 grid grid-cols-1 overflow-hidden border border-slate-200/80 bg-white/50 md:grid-cols-2">
                        <div className="border-b border-slate-200 px-6 py-5 md:border-b-0 md:border-r">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                                {t.globalWinRate}
                            </p>
                            <p className="mt-3 text-4xl font-bold text-emerald-600">86.68%</p>
                        </div>
                        <div className="px-6 py-5">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                                {t.activePlayers}
                            </p>
                            <p className="mt-3 text-4xl font-bold text-slate-800">1,204</p>
                        </div>
                    </section>

                    <section className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
                        <div>
                            <h2 className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-slate-900">
                                {t.howToPlay}
                            </h2>
                            <div className="space-y-5">
                                {howToPlay.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <article key={item.step} className="grid grid-cols-[26px_1fr] gap-4">
                                            <p className="pt-0.5 text-xl font-bold text-slate-400">{item.step}</p>
                                            <div>
                                                <div className="mb-2 inline-flex rounded-md border border-slate-200/80 bg-white/70 p-2 text-slate-800">
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-900">
                                                    {item.title}
                                                </h3>
                                                <p className="mt-2 text-xs leading-5 text-slate-600">{item.desc}</p>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <h2 className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-slate-900">
                                {t.scoringSystem}
                            </h2>
                            <div className="space-y-3">
                                <div className="rounded-md border border-slate-200/80 bg-white/70 p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-900">
                                            {t.bulls}
                                        </p>
                                        <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.35)]" />
                                    </div>
                                    <p className="mt-2 text-xs text-slate-600">{t.bullsDesc}</p>
                                </div>
                                <div className="rounded-md border border-slate-200/80 bg-white/70 p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-900">
                                            {t.cows}
                                        </p>
                                        <span className="h-3 w-3 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.35)]" />
                                    </div>
                                    <p className="mt-2 text-xs text-slate-600">{t.cowsDesc}</p>
                                </div>
                                <div className="rounded-md border border-slate-200/80 bg-white/60 p-4 text-xs text-slate-700">
                                    <p className="font-bold uppercase tracking-[0.16em] text-slate-900">{t.tacticalNote}</p>
                                    <p className="mt-2 leading-5 text-slate-600">{t.tacticalDesc}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}

