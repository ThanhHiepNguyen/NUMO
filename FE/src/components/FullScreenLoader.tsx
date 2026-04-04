type Props = {
    title?: string;
    subtitle?: string;
};

export default function FullScreenLoader({ title, subtitle }: Props) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"></div>
                {title ? <p className="text-sm font-semibold text-slate-700">{title}</p> : null}
                {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
            </div>
        </div>
    );
}

