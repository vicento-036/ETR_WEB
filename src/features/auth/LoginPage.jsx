import React from 'react';
import LoginLayout from '../../components/layout/LoginLayout.jsx';

function LoginPage({ onLoginSuccess }) {
  return <LoginLayout onLoginSuccess={onLoginSuccess} />;
}

export default LoginPage;
