

type WaitingRoomCardProps = {
    roomCode: string;
    playerOneName: string;
    playerTwoName: string;
    onCopyRoomCode: () => void;
};

export default function WaitingRoomCard({
    roomCode,
    playerOneName,
    playerTwoName,
    onCopyRoomCode,
}: WaitingRoomCardProps) {
    return (
        <div className="rounded-xl border border-slate-200/80 bg-white/70 p-5 shadow">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-600">Phòng chờ</p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-semibold text-slate-900">Mã phòng</p>
                    <p className="mt-1 font-mono text-2xl font-bold tracking-[0.28em] text-cyan-700">
                        {roomCode}
                    </p>
                </div>
                <button
                    onClick={onCopyRoomCode}
                    className="rounded border border-cyan-300 bg-cyan-500/10 px-3 py-2 text-xs font-bold tracking-[0.14em] text-cyan-700 hover:border-cyan-400"
                >
                    COPY MÃ PHÒNG
                </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200/80 bg-white/70 p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Người chơi 1</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                        {playerOneName}
                    </p>
                </div>
                <div className="rounded-lg border border-slate-200/80 bg-white/70 p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Người chơi 2</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                        {playerTwoName}
                    </p>
                </div>
            </div>

            <div className="mt-5 rounded-lg border border-slate-200/80 bg-white/70 p-4 text-sm text-slate-700">
                <p>
                    Mời bạn vào phòng bằng <b>mã phòng</b> ở trên. Khi đủ 2 người, <b>chủ phòng</b> bấm <b>BẮT ĐẦU</b>.
                </p>
            </div>
        </div>
    );
}

