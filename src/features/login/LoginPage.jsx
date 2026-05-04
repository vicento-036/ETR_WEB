import React from 'react';
import LoginLayout from './components/LoginLayout';

function LoginPage({ onLoginSuccess }) {
  return <LoginLayout onLoginSuccess={onLoginSuccess} />;
}

export default LoginPage;
