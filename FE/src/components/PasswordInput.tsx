import { useState } from 'react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
};

export default function PasswordInput({ value, onChange, placeholder = 'Password', className = '' }: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className={'relative ' + className}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-slate-300 bg-white px-3 py-2 pr-12 text-sm outline-none focus:border-cyan-400"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute inset-y-0 right-0 z-10 flex items-center px-3 text-xs text-slate-600 hover:text-slate-900"
        aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}

