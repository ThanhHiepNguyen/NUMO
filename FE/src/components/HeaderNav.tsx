
import { useNavigate } from 'react-router-dom';

export default function HeaderNav() {
  const nav = useNavigate();
  return (
    <header className="mx-auto mb-4 flex w-full max-w-5xl items-center justify-between rounded-xl border border-teal-200/50 bg-white/70 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-slate-600">
      <p className="font-semibold text-slate-800">NUMO</p>
      <nav className="flex items-center gap-4">
        <button onClick={() => nav('/')} className="hover:text-slate-900">Trang chủ</button>
        <button onClick={() => nav('/rank')} className="hover:text-slate-900">Xếp hạng</button>
        <button onClick={() => nav('/join')} className="hover:text-slate-900">Vào phòng</button>
        <button onClick={() => nav('/create')} className="hover:text-slate-900">Tạo phòng</button>
      </nav>
    </header>
  );
}

