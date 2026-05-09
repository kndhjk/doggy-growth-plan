import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PetProvider } from './context/PetContext';
import { I18nProvider } from './i18n/I18nContext';
import Layout        from './components/Layout/Layout';
import LoginPage     from './pages/LoginPage';
import RegisterPage  from './pages/RegisterPage';
import AdminPage     from './pages/AdminPage';
import PetPageV2     from './sandbox/PetPageV2';
import AIPage        from './pages/AIPage';
import MapPage       from './pages/MapPage';
import CommunityPage from './pages/CommunityPage';
import ProfilePage   from './pages/ProfilePage';
import MarketplacePage from './pages/MarketplacePage';
import MessagesPage    from './pages/MessagesPage';
import ChatPage        from './pages/ChatPage';
import AdoptPage from './pages/AdoptPage';
import InventoryPage from './pages/InventoryPage';
import LeaderboardPage from './pages/LeaderboardPage';
import HealthRecordsPage from './pages/HealthRecordsPage';
import AchievementsPage from './pages/AchievementsPage';
import DailyRewardsPage from './pages/DailyRewardsPage';
import PetTrainingPage from './pages/PetTrainingPage';

function Private({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading !== false) return null;
  return currentUser ? children : <Navigate to="/login" replace />;
}

function HomeRoute() {
  const location = useLocation();
  return <PetPageV2 key={location.pathname} />;
}

export default function App() {
  return (
    <AuthProvider>
      <PetProvider>
        <I18nProvider>
        <BrowserRouter>
          <Toaster
            position="top-center"
            gutter={12}
            toastOptions={{
              duration: 2500,
              style: { background:'#fff', border:'1px solid #fce7f3', color:'#9d174d' },
            }}
          />
          <Routes>
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin"    element={<AdminPage />} />

            {/* Authenticated routes with Layout nav */}
            <Route path="/" element={<Private><Layout /></Private>}>
              <Route index           element={<HomeRoute />} />
              <Route path="ai"       element={<AIPage />} />
              <Route path="map"      element={<MapPage />} />
              <Route path="community" element={<CommunityPage />} />
              <Route path="profile"  element={<ProfilePage />} />
              <Route path="marketplace" element={<MarketplacePage />} />
              <Route path="adopt"    element={<AdoptPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />
              <Route path="health"   element={<HealthRecordsPage />} />
              <Route path="achievements" element={<AchievementsPage />} />
              <Route path="rewards"  element={<DailyRewardsPage />} />
              <Route path="training" element={<PetTrainingPage />} />
            </Route>

            {/* Standalone routes (no Layout nav) */}
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:conversationId" element={<ChatPage />} />
          </Routes>
        </BrowserRouter>
        </I18nProvider>
      </PetProvider>
    </AuthProvider>
  );
}
