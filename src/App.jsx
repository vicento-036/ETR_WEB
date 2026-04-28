import React, { useEffect, useState } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import appLogo from './assets/branding/etr-logo.png';
import { clearAuth, getToken, getUser, isTokenExpired } from './services/authStorage';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

function buildApiUrl(path) {
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

function getStoredUser() {
  if (isTokenExpired()) {
    clearAuth();
    return null;
  }

  return getUser();
}

function App() {
  const [sessionUser, setSessionUser] = useState(getStoredUser);

  useEffect(() => {
    document.title = 'ETR-WEB';

    let favicon = document.querySelector("link[rel='icon']");
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.setAttribute('rel', 'icon');
      document.head.appendChild(favicon);
    }

    favicon.setAttribute('type', 'image/png');
    favicon.setAttribute('href', appLogo);
  }, []);

  const handleLogout = async () => {
    const token = getToken();

    try {
      if (token) {
        await fetch(buildApiUrl('/api/login/logout'), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // Local logout should still succeed even if the API is unavailable.
    } finally {
      clearAuth();
      setSessionUser(null);
    }
  };

  if (sessionUser) {
    return <DashboardPage user={sessionUser} onLogout={handleLogout} />;
  }

  return <LoginPage onLoginSuccess={setSessionUser} />;
}

export default App;
