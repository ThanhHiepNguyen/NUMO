

type Props = {
    className?: string;
    children: React.ReactNode;
};

export default function GlassCard({ className = '', children }: Props) {
    return (
        <div
            className={
                'w-full rounded-2xl border border-teal-200/60 bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/75 p-5 shadow-[0_0_0_1px_rgba(13,148,136,0.18),0_10px_50px_rgba(2,132,199,0.10)] ' +
                className
            }
        >
            {children}
        </div>
    );
}

