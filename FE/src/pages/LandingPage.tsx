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
        <div className="min-h-screen bg-[#030B1B] px-3 py-3 text-slate-100 sm:px-5">
            <div className="mx-auto min-h-[95vh] w-full max-w-5xl rounded-2xl border border-indigo-500/35 bg-[#071329] shadow-[0_0_0_1px_rgba(99,102,241,0.18),0_0_40px_rgba(59,130,246,0.10)]">
                <header className="flex items-center justify-between border-b border-indigo-500/15 px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    <p className="font-semibold text-slate-200">{t.badge}</p>
                    <div className="hidden items-center gap-6 md:flex">
                        <button className="text-indigo-300">{t.navBattle}</button>
                        <button className="hover:text-slate-200">{t.navRank}</button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setLang('en')}
                            className={`rounded px-1.5 py-0.5 normal-case ${lang === 'en' ? 'text-slate-200' : 'text-slate-600 hover:text-slate-300'}`}
                        >
                            EN
                        </button>
                        <button
                            onClick={() => setLang('vi')}
                            className={`rounded px-1.5 py-0.5 normal-case ${lang === 'vi' ? 'text-slate-200' : 'text-slate-600 hover:text-slate-300'}`}
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
                                className="inline-flex items-center gap-1.5 rounded-md border border-slate-800/70 bg-[#030B1B]/30 px-2 py-1 text-[10px] font-bold tracking-[0.16em] text-slate-200 hover:border-slate-600"
                                title={isAuthed ? (displayName || 'Account') : 'Login'}
                            >
                                <UserCircle2 className={`h-4 w-4 ${isAuthed ? 'text-emerald-300' : 'text-slate-300'}`} />
                                <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
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
                                        <a
                                            href="#"
                                            onClick={(e) => e.preventDefault()}
                                            aria-disabled="true"
                                            className="flex w-full cursor-not-allowed items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-400/80"
                                        >
                                            <UserCircle2 className="h-4 w-4 text-slate-400" />
                                            Thông tin tài khoản
                                        </a>

                                        <a
                                            href="#"
                                            onClick={(e) => e.preventDefault()}
                                            aria-disabled="true"
                                            className="flex w-full cursor-not-allowed items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-400/80"
                                        >
                                            <KeyRound className="h-4 w-4 text-slate-400" />
                                            Đổi mật khẩu
                                        </a>

                                        <a
                                            href="#"
                                            onClick={(e) => e.preventDefault()}
                                            aria-disabled="true"
                                            className="flex w-full cursor-not-allowed items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-400/80"
                                        >
                                            <History className="h-4 w-4 text-slate-400" />
                                            Lịch sử
                                        </a>

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
                            <span className="text-slate-100">{t.heroTitleA} </span>
                            <span className="bg-gradient-to-r from-slate-200 via-indigo-200 to-cyan-200 bg-clip-text text-transparent">
                                {t.heroTitleB}
                            </span>
                        </h1>
                        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-300/80">
                            {t.heroDesc}
                        </p>
                        <div className="mx-auto mt-8 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
                            <button
                                onClick={() => nav('/create')}
                                className="inline-flex items-center justify-center gap-2 rounded-sm border border-indigo-300/25 bg-gradient-to-r from-indigo-600/90 to-blue-600/90 px-5 py-3 text-xs font-bold tracking-[0.18em] text-white transition-all hover:brightness-110 active:scale-[0.98]"
                            >
                                <ShieldCheck className="h-4 w-4" />
                                {t.createRoom}
                            </button>
                            <button
                                onClick={() => nav('/join')}
                                className="inline-flex items-center justify-center gap-2 rounded-sm border border-slate-700/70 bg-transparent px-5 py-3 text-xs font-bold tracking-[0.18em] text-slate-200 transition-all hover:border-slate-500 hover:text-white active:scale-[0.98]"
                            >
                                <LogIn className="h-4 w-4" />
                                {t.enterRoom}
                            </button>
                        </div>
                    </section>

                    <section className="mt-10 grid grid-cols-1 overflow-hidden border border-slate-800/60 bg-[#09172E]/70 md:grid-cols-2">
                        <div className="border-b border-slate-700/50 px-6 py-5 md:border-b-0 md:border-r">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                                {t.globalWinRate}
                            </p>
                            <p className="mt-3 text-4xl font-bold text-emerald-300">86.68%</p>
                        </div>
                        <div className="px-6 py-5">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                                {t.activePlayers}
                            </p>
                            <p className="mt-3 text-4xl font-bold text-slate-100">1,204</p>
                        </div>
                    </section>

                    <section className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
                        <div>
                            <h2 className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-slate-200">
                                {t.howToPlay}
                            </h2>
                            <div className="space-y-5">
                                {howToPlay.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <article key={item.step} className="grid grid-cols-[26px_1fr] gap-4">
                                            <p className="pt-0.5 text-xl font-bold text-slate-600">{item.step}</p>
                                            <div>
                                                <div className="mb-2 inline-flex rounded-md border border-slate-700/70 bg-slate-900/30 p-2 text-slate-200">
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-100">
                                                    {item.title}
                                                </h3>
                                                <p className="mt-2 text-xs leading-5 text-slate-400/80">{item.desc}</p>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <h2 className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-slate-200">
                                {t.scoringSystem}
                            </h2>
                            <div className="space-y-3">
                                <div className="rounded-md border border-slate-800/70 bg-[#0A1A34]/60 p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-200">
                                            {t.bulls}
                                        </p>
                                        <span className="h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.45)]" />
                                    </div>
                                    <p className="mt-2 text-xs text-slate-500">{t.bullsDesc}</p>
                                </div>
                                <div className="rounded-md border border-slate-800/70 bg-[#0A1A34]/60 p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-200">
                                            {t.cows}
                                        </p>
                                        <span className="h-3 w-3 rounded-full bg-amber-200 shadow-[0_0_10px_rgba(252,211,77,0.45)]" />
                                    </div>
                                    <p className="mt-2 text-xs text-slate-500">{t.cowsDesc}</p>
                                </div>
                                <div className="rounded-md border border-slate-800/70 bg-slate-900/30 p-4 text-xs text-slate-200">
                                    <p className="font-bold uppercase tracking-[0.16em] text-slate-100">{t.tacticalNote}</p>
                                    <p className="mt-2 leading-5 text-slate-400/80">{t.tacticalDesc}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}

