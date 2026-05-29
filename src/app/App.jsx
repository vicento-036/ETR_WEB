import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppRoutes from './routes.jsx';
import ConfirmDialog from '../components/shared/ConfirmDialog.jsx';
import appLogo from '../assets/branding/etr-logo.png';
import { clearAuth, getUser, isTokenExpired } from '../services/authStorage';
import { logoutUser } from '../services/authApi';
import { formatLoginDocumentTitle } from '../constants/documentTitle.js';

function getStoredUser() {
  if (isTokenExpired()) {
    clearAuth();
    return null;
  }

  return getUser();
}

function App() {
  const [sessionUser, setSessionUser] = useState(getStoredUser);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let favicon = document.querySelector("link[rel='icon']");
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.setAttribute('rel', 'icon');
      document.head.appendChild(favicon);
    }

    favicon.setAttribute('type', 'image/png');
    favicon.setAttribute('href', appLogo);
  }, []);

  useEffect(() => {
    if (location.pathname === '/login') {
      document.title = formatLoginDocumentTitle();
    }
  }, [location.pathname]);

  const confirmLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // Local logout should still succeed even if the API is unavailable.
    } finally {
      setIsLogoutConfirmOpen(false);
      clearAuth();
      setSessionUser(null);
      navigate('/login', { replace: true });
    }
  };

  const handleLoginSuccess = (user) => {
    setSessionUser(user);
    const redirectPath = location.state?.from?.pathname || '/dashboard';
    navigate(redirectPath, { replace: true });
  };

  return (
    <>
      <AppRoutes
        sessionUser={sessionUser}
        location={location}
        onLoginSuccess={handleLoginSuccess}
        onLogoutRequest={() => setIsLogoutConfirmOpen(true)}
      />

      {isLogoutConfirmOpen ? (
        <ConfirmDialog
          title="Confirm Logout"
          message="Are you sure you want to log out?"
          confirmLabel="Logout"
          onCancel={() => setIsLogoutConfirmOpen(false)}
          onConfirm={confirmLogout}
        />
      ) : null}
    </>
  );
}

export default App;
