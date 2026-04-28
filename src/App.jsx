import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { clearAuth, getToken, getUser, isTokenExpired } from './services/authStorage';

function App() {
  const [sessionUser, setSessionUser] = useState(() => {
    if (isTokenExpired()) {
      clearAuth();
      return null;
    }

    return getUser();
  });
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const confirmLogout = async () => {
    const token = getToken();

    try {
      if (token) {
        await fetch('/api/login/logout', {
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
