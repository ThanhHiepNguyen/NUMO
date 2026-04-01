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

export default function App() {
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
