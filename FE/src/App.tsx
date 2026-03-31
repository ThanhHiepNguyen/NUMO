import './App.css';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <div className="w-full max-w-4xl px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">NUMO</h1>
          <p className="text-slate-400 mt-2 text-sm">
            Chuẩn bị viết FE cho game đoán số 1v1. Hiện tại đây là khung rỗng để bạn build tiếp.
          </p>
        </header>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
          <p>Hãy bắt đầu từ đây: thêm layout Home, Enter Room, Create Room, và màn chơi theo ý bạn.</p>
        </div>
      </div>
    </div>
  );
}

