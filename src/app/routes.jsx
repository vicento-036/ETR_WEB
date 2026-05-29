import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../features/auth/LoginPage.jsx';
import DashboardPage from '../features/dashboard/DashboardPage.jsx';

function AppRoutes({ sessionUser, location, onLoginSuccess, onLogoutRequest }) {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          sessionUser
            ? <Navigate to="/dashboard" replace />
            : <LoginPage onLoginSuccess={onLoginSuccess} />
        }
      />
      <Route
        path="/dashboard"
        element={
          sessionUser
            ? <DashboardPage user={sessionUser} onLogout={onLogoutRequest} />
            : <Navigate to="/login" replace state={{ from: location }} />
        }
      />
      <Route
        path="/dashboard/:moduleId"
        element={
          sessionUser
            ? <DashboardPage user={sessionUser} onLogout={onLogoutRequest} />
            : <Navigate to="/login" replace state={{ from: location }} />
        }
      />
      <Route path="/" element={<Navigate to={sessionUser ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={sessionUser ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default AppRoutes;
