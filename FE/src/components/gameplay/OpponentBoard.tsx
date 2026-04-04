
import type { GuessLog } from '../../types/gameplay';

type OpponentBoardProps = {
    opponentGuessLogs: GuessLog[];
    playerNameById: Record<string, string>;
    playerRoleById: Record<string, string>;
};

export default function OpponentBoard({
    opponentGuessLogs,
    playerNameById,
    playerRoleById,
}: OpponentBoardProps) {
    return (
        <section className="bg-white/70 p-4 sm:p-6 flex flex-col h-full">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-rose-600 mb-6 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                Bảng đối thủ
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {opponentGuessLogs.length ? (
                    <div className="rounded-md border border-slate-200/80 bg-white/70 p-4 text-sm text-slate-700">
                        <p className="mb-2 font-semibold uppercase tracking-[0.12em]">Lịch sử đoán đối thủ</p>
                        <div className="space-y-2">
                            {opponentGuessLogs.map((g) => (
                                <div key={g.id} className="flex items-center justify-between rounded border border-slate-200/80 bg-white/70 px-3 py-2">
                                    <span className="font-mono tracking-[0.18em]">{g.guessValue || '----'}</span>
                                    <span className="text-xs text-slate-600">
                                        {playerNameById[g.playerInRoomId] || playerRoleById[g.playerInRoomId] || 'Người chơi'} | Đúng {g.correctDigits} số | Đúng {g.correctPositions} vị trí
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-md border border-slate-200/80 bg-white/70 p-4 text-sm text-slate-600">
                        Chưa có dữ liệu.
                    </div>
                )}
            </div>
        </section>
    );
}

