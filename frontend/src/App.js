import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PetProvider } from './context/PetContext';
import Layout       from './components/Layout/Layout';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PetPage      from './pages/PetPage';
import AIPage       from './pages/AIPage';
import MapPage      from './pages/MapPage';
import CommunityPage from './pages/CommunityPage';
import ProfilePage  from './pages/ProfilePage';

function Private({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <PetProvider>
        <BrowserRouter>
          <Toaster position="top-center" toastOptions={{
            style: { background:'#fff', border:'1px solid #fce7f3', color:'#9d174d' },
          }} />
          <Routes>
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<Private><Layout /></Private>}>
              <Route index          element={<PetPage />} />
              <Route path="ai"      element={<AIPage />} />
              <Route path="map"     element={<MapPage />} />
              <Route path="community" element={<CommunityPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PetProvider>
    </AuthProvider>
  );
}
