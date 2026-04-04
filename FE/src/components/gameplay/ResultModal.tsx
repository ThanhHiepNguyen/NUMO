type ResultModalProps = {
    open: boolean;
    isTie: boolean;
    didIWin: boolean;
    onHome: () => void;
};

export default function ResultModal({ open, isTie, didIWin, onHome }: ResultModalProps) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div
                className={`w-full max-w-md rounded-xl border p-5 text-sm shadow-2xl bg-white/95 ${isTie
                    ? 'border-amber-300 text-amber-700'
                    : didIWin
                        ? 'border-emerald-300 text-emerald-700'
                        : 'border-rose-300 text-rose-700'
                    }`}
            >
                <p className="text-xs uppercase tracking-[0.16em] opacity-80">Kết quả trận đấu</p>
                <p className="mt-1 text-2xl font-bold">
                    {isTie ? 'HÒA' : didIWin ? 'BẠN THẮNG' : 'BẠN THUA'}
                </p>
                <div className="mt-4 flex gap-2">
                    <button
                        onClick={onHome}
                        className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs font-bold tracking-[0.12em] text-slate-800 hover:border-slate-400"
                    >
                        GO HOME
                    </button>
                </div>
            </div>
        </div>
    );
}

