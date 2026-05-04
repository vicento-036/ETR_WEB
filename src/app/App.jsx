import React, { useEffect, useState } from 'react';
import LoginPage from '../features/login/LoginPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import appLogo from '../assets/branding/etr-logo.png';
import { clearAuth, getToken, getUser, isTokenExpired } from '../shared/services/authStorage';

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
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

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

  const confirmLogout = async () => {
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
      setIsLogoutConfirmOpen(false);
      clearAuth();
      setSessionUser(null);
    }
  };

  if (sessionUser) {
    return (
      <>
        <DashboardPage user={sessionUser} onLogout={() => setIsLogoutConfirmOpen(true)} />

        {isLogoutConfirmOpen ? (
          <div className="etr-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="logout-confirm-title">
            <div className="etr-confirm-modal">
              <h2 id="logout-confirm-title">Confirm Logout</h2>
              <p>Are you sure you want to log out?</p>
              <div className="etr-confirm-actions">
                <button type="button" className="etr-confirm-secondary" onClick={() => setIsLogoutConfirmOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="etr-confirm-primary" onClick={confirmLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return <LoginPage onLoginSuccess={setSessionUser} />;
}

export default App;
