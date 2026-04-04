type Player = { id: string; nickname: string; role: string };

type PlayerSelectorProps = {
    players: Player[];
    effectivePlayerId?: string | null;
    onSelect: (playerId: string) => void;
    className?: string;
};

export default function PlayerSelector({
    players,
    effectivePlayerId,
    onSelect,
    className = 'rounded-md border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200',
}: PlayerSelectorProps) {
    const shouldHide = !!effectivePlayerId || players.length === 0;
    return shouldHide ? null : (
        <div className={className}>
            <p className="font-semibold">Bạn là ai? (refresh sẽ mất playerId)</p>
            <div className="mt-3 flex flex-wrap gap-2">
                {players.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => onSelect(p.id)}
                        className="rounded border border-amber-300/30 bg-[#030B1B]/40 px-3 py-2 text-xs font-bold tracking-[0.12em] text-amber-100 hover:border-amber-200"
                    >
                        {p.nickname} ({p.role})
                    </button>
                ))}
            </div>
        </div>
    );
}

