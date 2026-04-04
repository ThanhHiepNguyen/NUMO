
import { Send } from 'lucide-react';

type GuessFormProps = {
    value: string;
    onChange: (v: string) => void;
    onSubmit: () => void;
    inputDisabled: boolean;
    placeholder: string;
    buttonDisabled: boolean;
    submitting: boolean;
};

export default function GuessForm({
    value,
    onChange,
    onSubmit,
    inputDisabled,
    placeholder,
    buttonDisabled,
    submitting,
}: GuessFormProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
        onChange('');
    };

    return (
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row sm:gap-4">
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
                disabled={inputDisabled}
                placeholder={placeholder}
                className="w-full rounded-sm border border-cyan-300 bg-white px-4 py-3 text-center font-mono text-xl font-bold tracking-[0.14em] text-cyan-700 placeholder-slate-400 outline-none transition-all focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-4 sm:text-3xl sm:tracking-[0.2em]"
            />
            <button
                type="submit"
                disabled={buttonDisabled}
                className="inline-flex items-center justify-center gap-2 rounded-sm bg-linear-to-r from-teal-500 to-cyan-500 px-6 py-3 text-xs font-bold tracking-[0.14em] text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-500 sm:px-8 sm:py-4 sm:text-sm sm:tracking-[0.2em]"
            >
                <Send className="h-5 w-5" />
                {submitting ? '...' : 'ĐOÁN'}
            </button>
        </form>
    );
}

