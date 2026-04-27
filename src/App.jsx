import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  const [sessionUser, setSessionUser] = useState(null);

  if (sessionUser) {
    return <DashboardPage user={sessionUser} onLogout={() => setSessionUser(null)} />;
  }

  return <LoginPage onLoginSuccess={setSessionUser} />;
}

export default App;
