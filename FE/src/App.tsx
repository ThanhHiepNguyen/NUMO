import './App.css';
import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import JoinRoomPage from './pages/JoinRoomPage';
import AuthPage from './pages/AuthPage';
import CreateRoomPage from './pages/CreateRoomPage';
import GameplayPage from './pages/GameplayPage';
import AccountPage from './pages/AccountPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import HistoryPage from './pages/HistoryPage';
import RankPage from './pages/RankPage';
import { useAuth } from './state/auth';
import FullScreenLoader from './components/FullScreenLoader';

export default function App() {
  const { hydrated } = useAuth();
  if (!hydrated) {
    return <FullScreenLoader subtitle="Vui lòng đợi trong giây lát." />;
  }
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/join" element={<JoinRoomPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/create" element={<CreateRoomPage />} />
      <Route path="/room/:code" element={<GameplayPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/account/change-password" element={<ChangePasswordPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/rank" element={<RankPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
