
import { Clock, Crosshair, LogOut, ShieldAlert } from 'lucide-react';

type TurnHeaderProps = {
    turnStatusText: string;
    roomCode: string;
    displayName: string;
    canStart: boolean;
    onStart: () => void;
    displayTimerText: string;
    onLeaveRoom: () => void;
    submittingLeave: boolean;
};

export default function TurnHeader({
    turnStatusText,
    roomCode,
    displayName,
    canStart,
    onStart,
    displayTimerText,
    onLeaveRoom,
    submittingLeave,
}: TurnHeaderProps) {
    return (
        <header className="flex flex-col gap-3 border-b border-teal-200/60 bg-white/60 px-3 py-3 sm:px-6 sm:py-4">
            <div className="w-full px-3 py-2 rounded-sm border flex items-center justify-center gap-2 transition-all border-slate-300 bg-white/70 text-slate-600 sm:px-8 sm:py-2.5">
                <Crosshair className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.18em]">
                    {turnStatusText}
                </span>
            </div>

            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3">
                    <ShieldAlert className="h-5 w-5 text-teal-600" />
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                            Mã phòng
                        </p>
                        <p className="font-mono text-base font-bold text-cyan-700 tracking-[0.2em] sm:text-xl sm:tracking-widest">
                            {roomCode}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                            Bạn: {displayName || 'Guest'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    {canStart ? (
                        <button
                            onClick={onStart}
                            className="rounded border border-emerald-300 bg-emerald-500/10 px-2 py-1.5 text-[10px] font-bold tracking-widest text-emerald-700 hover:border-emerald-400 sm:px-3 sm:py-2 sm:text-[11px] sm:tracking-[0.14em]"
                        >
                            BẮT ĐẦU
                        </button>
                    ) : null}
                    <div className="flex items-center gap-1.5 text-rose-500 sm:gap-2">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="font-mono text-base font-bold sm:text-xl">{displayTimerText}</span>
                    </div>
                    <button
                        onClick={onLeaveRoom}
                        disabled={submittingLeave}
                        title="Rời phòng"
                        aria-label="Rời phòng"
                        className="rounded border border-rose-300 bg-rose-500/10 px-2 py-1.5 text-[10px] font-bold tracking-widest text-rose-700 hover:border-rose-400 disabled:opacity-50 sm:px-3 sm:py-2 sm:text-[11px]"
                    >
                        {submittingLeave ? '...' : <LogOut className="h-4 w-4" />}
                    </button>
                </div>
            </div>
        </header>
    );
}

