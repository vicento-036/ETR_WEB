import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { clearAuth, getToken } from './services/authStorage';

function App() {
  const [sessionUser, setSessionUser] = useState(null);

  const handleLogout = async () => {
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
