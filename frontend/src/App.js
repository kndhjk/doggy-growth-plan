import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PetProvider } from './context/PetContext';
import { I18nProvider } from './i18n/I18nContext';
import Layout       from './components/Layout/Layout';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PetPageV2    from './sandbox/PetPageV2';
import AIPage       from './pages/AIPage';
import MapPage      from './pages/MapPage';
import CommunityPage from './pages/CommunityPage';
import ProfilePage  from './pages/ProfilePage';

function Private({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading !== false) return null; return currentUser ? children : <Navigate to="/login" replace />;
}

/* ── Wrapper forces PetPageV2 to remount fresh when navigating back to /.
    Without the key, React Router re-uses the same component instance and
    Framer Motion / flex-layout state from the previous visit can persist,
    causing the layout to break. The key={location.pathname} trick is the
    standard React pattern for forcing remount on (nested) route re-entry. ── */
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
            <Route path="/" element={<Private><Layout /></Private>}>
              <Route index          element={<HomeRoute />} />
              <Route path="ai"      element={<AIPage />} />
              <Route path="map"     element={<MapPage />} />
              <Route path="community" element={<CommunityPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </I18nProvider>
      </PetProvider>
    </AuthProvider>
  );
}