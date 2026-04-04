
import type { GuessLog } from '../../types/gameplay';

type MyBoardProps = {
    secretPhase: boolean;
    codeLength?: number | null;
    secretValue: string;
    onSecretChange: (v: string) => void;
    onSubmitSecret: () => void;
    submittingSecret: boolean;
    effectivePlayerId?: string | null;
    mySecretPreview?: string | null;
    myGuessLogs: GuessLog[];
    playerSelector?: React.ReactNode;
};

export default function MyBoard({
    secretPhase,
    codeLength,
    secretValue,
    onSecretChange,
    onSubmitSecret,
    submittingSecret,
    effectivePlayerId,
    mySecretPreview,
    myGuessLogs,
    playerSelector,
}: MyBoardProps) {
    return (
        <section className="bg-white/80 p-4 sm:p-6 flex flex-col h-full">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-600"></span>
                    Bảng của bạn
                </h2>
                {mySecretPreview ? (
                    <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                        <span className="hidden sm:inline">Mật mã của bạn: </span>
                        <span className="font-mono font-bold tracking-[0.18em]">{mySecretPreview}</span>
                    </div>
                ) : null}
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {secretPhase ? (
                    <div className="rounded-md border border-slate-200/80 bg-white/70 p-4 text-sm">
                        <p className="mb-2 text-slate-800 font-semibold uppercase tracking-[0.12em]">
                            Nhập mật mã
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={secretValue}
                                onChange={(e) => onSecretChange(e.target.value.replace(/\D/g, ''))}
                                placeholder={`Nhập ${typeof codeLength === 'number' ? codeLength : '?'} chữ số`}
                                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-400"
                            />
                            <button
                                onClick={onSubmitSecret}
                                disabled={submittingSecret || !effectivePlayerId}
                                className="rounded bg-linear-to-r from-teal-500 to-cyan-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                            >
                                {submittingSecret ? '...' : 'GỬI'}
                            </button>
                        </div>
                        {!effectivePlayerId ? (
                            <p className="mt-2 text-xs text-amber-600">
                                Thiếu playerId, vui lòng vào lại phòng từ Join/Create.
                            </p>
                        ) : null}
                    </div>
                ) : (
                    <div className="rounded-md border border-slate-200/80 bg-white/70 p-4 text-sm text-slate-600">
                        <p>Đang chờ...</p>
                    </div>
                )}

                {playerSelector}

                {myGuessLogs.length ? (
                    <div className="rounded-md border border-slate-200/80 bg-white/70 p-4 text-sm text-slate-700">
                        <p className="mb-2 font-semibold uppercase tracking-[0.12em]">Lịch sử đoán của bạn</p>
                        <div className="space-y-2">
                            {myGuessLogs.map((g) => (
                                <div key={g.id} className="flex items-center justify-between rounded border border-slate-200/80 bg-white/70 px-3 py-2">
                                    <span className="font-mono tracking-[0.18em]">{g.guessValue || '----'}</span>
                                    <span className="text-xs text-slate-600">
                                        Đúng {g.correctDigits} số | Đúng {g.correctPositions} vị trí
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
        </section>
    );
}

